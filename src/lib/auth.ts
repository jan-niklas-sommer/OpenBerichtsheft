import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorize } from "./authorize";
import { prisma } from "@/lib/prisma";

const roleCache = new Map<string, { role: string; trainingStartDate: string | null; fetchedAt: number }>();
const ROLE_CACHE_TTL = 5 * 60 * 1000;

/**
 * Invalidiert den Rollen-Cache. Hinweis: funktioniert nur auf der Instanz, die
 * die Änderung durchführt (Single-Instance). Bei Multi-Instance-Deployments
 * (Vercel/Lambda) kann die alte Rolle bis zu ROLE_CACHE_TTL (5 Min) auf anderen
 * Instanzen erhalten bleiben. Siehe ARCHITECTURE.md / DEPLOY.md.
 */
export function invalidateRoleCache(userId?: string) {
  if (userId) roleCache.delete(userId);
  else roleCache.clear();
}

export { authorize };

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      authorize,
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
