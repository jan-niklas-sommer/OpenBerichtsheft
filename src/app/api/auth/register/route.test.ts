/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-pw"),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid input", async () => {
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await POST({ json: async () => ({ email: "a@b.de", name: "Test", password: "123" }) } as any);
    expect(res.status).toBe(400);
  });

  it("creates new user and sends verification email", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: "u1", email: "a@b.de", name: "Test" });
    (prisma.verificationToken.create as any).mockResolvedValue({});

    const res = await POST({ json: async () => ({ email: "a@b.de", name: "Test", password: "password123" }) } as any);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toContain("Registrierung erfolgreich");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "a@b.de", role: "trainee" }),
      }),
    );
    expect(sendVerificationEmail).toHaveBeenCalledWith("a@b.de", expect.any(String), "Test");
  });

  it("returns 409 for already verified existing user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", emailVerified: new Date() });

    const res = await POST({ json: async () => ({ email: "a@b.de", name: "Test", password: "password123" }) } as any);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("bereits registriert");
  });

  it("resends verification for unverified existing user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", email: "a@b.de", name: "Test", emailVerified: null });
    (prisma.verificationToken.deleteMany as any).mockResolvedValue({});
    (prisma.verificationToken.create as any).mockResolvedValue({});

    const res = await POST({ json: async () => ({ email: "a@b.de", name: "Test", password: "password123" }) } as any);
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalled();
  });

  it("returns 500 when email sending fails", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: "u1" });
    (prisma.verificationToken.create as any).mockResolvedValue({});
    (sendVerificationEmail as any).mockRejectedValue(new Error("SMTP error"));

    const res = await POST({ json: async () => ({ email: "a@b.de", name: "Test", password: "password123" }) } as any);
    expect(res.status).toBe(500);
  });
});
