import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige E-Mail-Adresse" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified || user.deactivatedAt || user.anonymizedAt) {
    return NextResponse.json({ message: "Falls ein Konto existiert, wurde eine E-Mail gesendet" });
  }

  await prisma.verificationToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { email, token, expiresAt },
  });

  try {
    await sendVerificationEmail(email, token, user.name);
  } catch {
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Verifizierung erneut gesendet" });
}
