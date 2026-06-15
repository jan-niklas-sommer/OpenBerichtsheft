/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";



vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn().mockReturnValue(false),
  recordFailedAttempt: vi.fn(),
  clearAttempts: vi.fn(),
}));

import { authorize } from "./authorize";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

const validUser = {
  id: "u1",
  email: "test@example.com",
  name: "Test",
  role: "trainee",
  passwordHash: "hashed",
  deactivatedAt: null,
  anonymizedAt: null,
  emailVerified: new Date(),
};

describe("authorize (echte Funktion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isRateLimited as any).mockReturnValue(false);
  });

  it("returns null bei fehlenden Credentials", async () => {
    expect(await authorize(undefined)).toBe(null);
    expect(await authorize({})).toBe(null);
    expect(await authorize({ email: "a@b.de" })).toBe(null);
  });

  it("returns null wenn rate-limited", async () => {
    (isRateLimited as any).mockReturnValue(true);
    expect(await authorize({ email: "a@b.de", password: "x" })).toBe(null);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null wenn User nicht existiert", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    expect(await authorize({ email: "a@b.de", password: "x" })).toBe(null);
  });

  it("returns null bei deaktiviertem User", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...validUser, deactivatedAt: new Date() });
    expect(await authorize({ email: "a@b.de", password: "x" })).toBe(null);
  });

  it("returns null bei anonymisiertem User", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...validUser, anonymizedAt: new Date() });
    expect(await authorize({ email: "a@b.de", password: "x" })).toBe(null);
  });

  it("wirft EmailNotVerified bei unverified E-Mail", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ ...validUser, emailVerified: null });
    await expect(authorize({ email: "a@b.de", password: "x" })).rejects.toThrow();
  });

  it("records failed attempt bei falschem Passwort", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(validUser);
    (verifyPassword as any).mockResolvedValue(false);
    expect(await authorize({ email: "test@example.com", password: "wrong" })).toBe(null);
    expect(recordFailedAttempt).toHaveBeenCalledWith("test@example.com");
  });

  it("returns User + cleared attempts bei korrektem Login", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(validUser);
    (verifyPassword as any).mockResolvedValue(true);
    const result = await authorize({ email: "test@example.com", password: "correct" });
    expect(result).toEqual({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      role: "trainee",
    });
    expect(clearAttempts).toHaveBeenCalledWith("test@example.com");
    expect(recordFailedAttempt).not.toHaveBeenCalled();
  });
});
