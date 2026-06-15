import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";

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

  // 1. Token + zugehörige E-Mail lesen (für den User-Lookup).
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { email: true, expiresAt: true },
  });
  if (!resetToken) {
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
    await prisma.passwordResetToken.deleteMany({ where: { token } }).catch(() => {});
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an." },
      { status: 400 },
    );
  }

  // 2. Atomarer Konsum: deleteMany mit Ablauf-Bedingung ist das Race-Gate.
  // Bei zwei parallelen Requests mit gleichem Token gewinnt nur einer
  // (count === 1); der Verlierer erhält count === 0 und ändert nichts.
  const consumed = await prisma.passwordResetToken.deleteMany({
    where: { token, expiresAt: { gt: new Date() } },
  });
  if (consumed.count === 0) {
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an." },
      { status: 400 },
    );
  }

  // 3. Passwort aktualisieren (nur der Gewinner des Gates kommt hierhin).
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Passwort erfolgreich geändert. Sie können sich jetzt anmelden." });
}
