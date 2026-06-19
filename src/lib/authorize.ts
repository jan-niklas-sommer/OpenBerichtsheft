import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export async function authorize(credentials: Partial<Record<"email" | "password", unknown>> | undefined) {
  if (!credentials?.email || !credentials?.password) return null;

  const email = (credentials.email as string).trim().toLowerCase();

  if (isRateLimited(email)) return null;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.deactivatedAt || user.anonymizedAt) return null;

  if (!user.emailVerified) {
    const err = new Error("EMAIL_NOT_VERIFIED");
    err.name = "EmailNotVerified";
    throw err;
  }

  const valid = await verifyPassword((credentials.password as string).trim(), user.passwordHash);
  if (!valid) {
    recordFailedAttempt(email);
    return null;
  }

  clearAttempts(email);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
