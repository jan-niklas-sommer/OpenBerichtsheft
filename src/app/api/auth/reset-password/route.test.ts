/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findUnique: vi.fn(), deleteMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true })),
}));
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed:new"),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";

function makeReq(body: unknown) {
  return {
    json: async () => body,
    headers: new Map(),
  } as any;
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 on validation error (password too short)", async () => {
    const res = await POST(makeReq({ token: "t1", password: "123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on missing token", async () => {
    const res = await POST(makeReq({ password: "12345678" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    (rateLimit as any).mockReturnValueOnce({ success: false });
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 for unknown token", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeReq({ token: "bad", password: "12345678" }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when token expired (atomic gate count 0)", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date("2020-01-01"),
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", deactivatedAt: null, anonymizedAt: null,
    });
    (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 0 });
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when user no longer exists", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 1 });
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for deactivated user", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", deactivatedAt: new Date(), anonymizedAt: null,
    });
    (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 1 });
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(400);
  });

  it("resets password on success (atomic consume count 1)", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", deactivatedAt: null, anonymizedAt: null,
    });
    (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 1 });
    (prisma.user.update as any).mockResolvedValue({ id: "u1" });

    const res = await POST(makeReq({ token: "t1", password: "neuesPasswort12" }));
    expect(res.status).toBe(200);
    expect(hashPassword).toHaveBeenCalledWith("neuesPasswort12");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hashed:new" },
    });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { token: "t1", expiresAt: expect.any(Object) },
    });
  });
});
