import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { success } = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Zu viele Registrierungsversuche. Bitte später erneut versuchen." }, { status: 429 });
  }

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
    }
    return NextResponse.json({ message: "Falls diese E-Mail noch nicht registriert ist, wurde eine Verifizierungs-E-Mail gesendet." });
  }

  const passwordHash = await hashPassword(password);
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
    { message: "Falls diese E-Mail noch nicht registriert ist, wurde eine Verifizierungs-E-Mail gesendet." },
    { status: 201 },
  );
}
