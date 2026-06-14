/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findUnique: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true })),
}));
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed:new"),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { hash } from "bcryptjs";

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

  it("returns 400 and deletes token when expired", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date("2020-01-01"),
    });
    (prisma.passwordResetToken.delete as any).mockResolvedValue({});
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(400);
    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { token: "t1" } });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when user no longer exists", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.passwordResetToken.delete as any).mockResolvedValue({});
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
    (prisma.passwordResetToken.delete as any).mockResolvedValue({});
    const res = await POST(makeReq({ token: "t1", password: "12345678" }));
    expect(res.status).toBe(400);
  });

  it("resets password and deletes token on success", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", deactivatedAt: null, anonymizedAt: null,
    });
    (prisma.user.update as any).mockResolvedValue({ id: "u1" });
    (prisma.passwordResetToken.delete as any).mockResolvedValue({});

    const res = await POST(makeReq({ token: "t1", password: "neuesPasswort12" }));
    expect(res.status).toBe(200);
    expect(hash).toHaveBeenCalledWith("neuesPasswort12", 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hashed:new" },
    });
    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { token: "t1" } });
  });
});
