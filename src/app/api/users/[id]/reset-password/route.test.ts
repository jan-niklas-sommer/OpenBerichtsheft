/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  },
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("hashed:admin") }));

import { POST } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

function makeReq(body: unknown) {
  return {
    json: async () => body,
  } as any;
}

const adminSession = { user: { id: "a1", role: "admin" } };
const params = (id: string) => Promise.resolve({ id });

describe("POST /api/users/[id]/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(makeReq({ password: "12345678" }), { params: params("u1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "t1", role: "trainee" } });
    const res = await POST(makeReq({ password: "12345678" }), { params: params("u1") });
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown user", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeReq({ password: "12345678" }), { params: params("u1") });
    expect(res.status).toBe(404);
  });

  it("returns 400 for anonymized user", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: new Date(),
    });
    const res = await POST(makeReq({ password: "12345678" }), { params: params("u1") });
    expect(res.status).toBe(400);
  });

  it("returns 400 when neither password nor sendEmail given", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: null,
    });
    const res = await POST(makeReq({}), { params: params("u1") });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password too short", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: null,
    });
    const res = await POST(makeReq({ password: "123" }), { params: params("u1") });
    expect(res.status).toBe(400);
  });

  it("sets new password directly and clears pending tokens", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: null,
    });
    (prisma.user.update as any).mockResolvedValue({ id: "u1" });

    const res = await POST(makeReq({ password: "neuesPasswort12" }), { params: params("u1") });
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "hashed:admin" },
    });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { email: "a@b.de" } });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends reset email when sendEmail is true", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: null,
    });

    const res = await POST(makeReq({ sendEmail: true }), { params: params("u1") });
    expect(res.status).toBe(200);
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 500 when email sending fails", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1", email: "a@b.de", name: "Anna", anonymizedAt: null,
    });
    (sendPasswordResetEmail as any).mockRejectedValueOnce(new Error("smtp down"));

    const res = await POST(makeReq({ sendEmail: true }), { params: params("u1") });
    expect(res.status).toBe(500);
  });
});
