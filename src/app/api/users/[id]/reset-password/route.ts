import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminResetPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, anonymizedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.anonymizedAt) {
    return NextResponse.json(
      { error: "Anonymisierte Konten können nicht zurückgesetzt werden" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = adminResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { password, sendEmail } = parsed.data;

  if (password) {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { email: user.email } }),
    ]);
    return NextResponse.json({
      message: "Passwort erfolgreich geändert. Der Benutzer kann sich damit anmelden.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { email: user.email } }),
    prisma.passwordResetToken.create({ data: { email: user.email, token, expiresAt } }),
  ]);

  try {
    await sendPasswordResetEmail(user.email, token, user.name);
  } catch {
    return NextResponse.json(
      { error: "Reset-E-Mail konnte nicht versendet werden. SMTP prüfen oder Passwort direkt setzen." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Reset-Link wurde per E-Mail an den Benutzer gesendet (1 Stunde gültig).",
  });
}
