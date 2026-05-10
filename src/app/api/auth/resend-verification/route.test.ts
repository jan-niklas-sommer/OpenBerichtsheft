/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    verificationToken: { deleteMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for invalid email", async () => {
    const res = await POST({ json: async () => ({ email: "bad" }) } as any);
    expect(res.status).toBe(400);
  });

  it("returns generic message for unknown user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST({ json: async () => ({ email: "a@b.de" }) } as any);
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns generic message for already verified user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", emailVerified: new Date(), deactivatedAt: null, anonymizedAt: null });
    const res = await POST({ json: async () => ({ email: "a@b.de" }) } as any);
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends new verification email for unverified user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", name: "Test", emailVerified: null, deactivatedAt: null, anonymizedAt: null });
    (prisma.verificationToken.deleteMany as any).mockResolvedValue({});
    (prisma.verificationToken.create as any).mockResolvedValue({});

    const res = await POST({ json: async () => ({ email: "a@b.de" }) } as any);
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledWith("a@b.de", expect.any(String), "Test");
  });

  it("returns 500 when email fails", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", name: "Test", emailVerified: null, deactivatedAt: null, anonymizedAt: null });
    (prisma.verificationToken.deleteMany as any).mockResolvedValue({});
    (prisma.verificationToken.create as any).mockResolvedValue({});
    (sendVerificationEmail as any).mockRejectedValue(new Error("fail"));

    const res = await POST({ json: async () => ({ email: "a@b.de" }) } as any);
    expect(res.status).toBe(500);
  });
});
