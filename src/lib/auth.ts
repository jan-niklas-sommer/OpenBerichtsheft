import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

const roleCache = new Map<string, { role: string; trainingStartDate: string | null; fetchedAt: number }>();
const ROLE_CACHE_TTL = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;

        if (isRateLimited(email)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.deactivatedAt || user.anonymizedAt) return null;

        if (!user.emailVerified) {
          const err = new Error("EMAIL_NOT_VERIFIED");
          err.name = "EmailNotVerified";
          throw err;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        const userId = token.id as string;
        const cached = roleCache.get(userId);
        if (cached && Date.now() - cached.fetchedAt < ROLE_CACHE_TTL) {
          token.role = cached.role;
          token.trainingStartDate = cached.trainingStartDate;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, deactivatedAt: true, anonymizedAt: true, trainingStartDate: true },
          });
          if (!dbUser || dbUser.deactivatedAt || dbUser.anonymizedAt) {
            roleCache.delete(userId);
            return {};
          }
          token.role = dbUser.role;
          token.trainingStartDate = dbUser.trainingStartDate?.toISOString() ?? null;
          roleCache.set(userId, { role: dbUser.role, trainingStartDate: token.trainingStartDate as string | null, fetchedAt: Date.now() });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { trainingStartDate: string | null }).trainingStartDate = (token.trainingStartDate as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
