import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { success } = rateLimit(`reset-password:${ip}`, 20, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    if (resetToken) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    }
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: resetToken.email },
    select: { id: true, deactivatedAt: true, anonymizedAt: true },
  });

  if (!user || user.deactivatedAt || user.anonymizedAt) {
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an." },
      { status: 400 },
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ message: "Passwort erfolgreich geändert. Sie können sich jetzt anmelden." });
}
