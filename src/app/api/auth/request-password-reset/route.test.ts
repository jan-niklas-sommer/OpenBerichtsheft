/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true })),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

function makeReq(body: unknown) {
  return {
    json: async () => body,
    headers: new Map(),
  } as any;
}

describe("POST /api/auth/request-password-reset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 on invalid email", async () => {
    const res = await POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on missing body", async () => {
    const res = await POST(makeReq(null));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    (rateLimit as any).mockReturnValueOnce({ success: false });
    const res = await POST(makeReq({ email: "a@b.de" }));
    expect(res.status).toBe(429);
  });

  it("returns generic message and sends no email for unknown user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeReq({ email: "nobody@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("existiert");
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("creates token and sends email for active user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", name: "Anna", deactivatedAt: null, anonymizedAt: null,
    });
    const res = await POST(makeReq({ email: "a@b.de" }));
    expect(res.status).toBe(200);
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { email: "a@b.de" } });
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("does not send email for deactivated user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", name: "Anna", deactivatedAt: new Date(), anonymizedAt: null,
    });
    await POST(makeReq({ email: "a@b.de" }));
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not send email for anonymized user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", name: "Anna", deactivatedAt: null, anonymizedAt: new Date(),
    });
    await POST(makeReq({ email: "a@b.de" }));
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("still returns generic message when email sending fails", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", name: "Anna", deactivatedAt: null, anonymizedAt: null,
    });
    (sendPasswordResetEmail as any).mockRejectedValueOnce(new Error("smtp down"));
    const res = await POST(makeReq({ email: "a@b.de" }));
    expect(res.status).toBe(200);
  });
});
