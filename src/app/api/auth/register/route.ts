import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.emailVerified) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.verificationToken.deleteMany({ where: { email } });
      await prisma.verificationToken.create({
        data: { email, token, expiresAt },
      });
      await sendVerificationEmail(email, token, existing.name).catch(() => {});
      return NextResponse.json({ message: "Verifizierung erneut gesendet" });
    }
    return NextResponse.json({ error: "E-Mail bereits registriert" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "trainee" },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { email, token, expiresAt },
  });

  try {
    await sendVerificationEmail(email, token, name);
  } catch {
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: "Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails.", userId: user.id },
    { status: 201 },
  );
}
