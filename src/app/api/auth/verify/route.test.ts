/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops.map((fn: any) => fn))),
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

function makeReq(token?: string) {
  const url = new URL("http://localhost:3000/api/auth/verify");
  if (token) url.searchParams.set("token", token);
  return { nextUrl: url, url: url.toString() } as any;
}

describe("GET /api/auth/verify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to login with missing_token when no token provided", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_token");
  });

  it("redirects with invalid_token for unknown token", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue(null);
    const res = await GET(makeReq("bad-token"));
    expect(res.headers.get("location")).toContain("error=invalid_token");
  });

  it("redirects with token_expired for expired token", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date("2020-01-01"),
    });
    (prisma.verificationToken.delete as any).mockResolvedValue({});
    const res = await GET(makeReq("t1"));
    expect(res.headers.get("location")).toContain("error=token_expired");
  });

  it("redirects with user_not_found when user missing", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.verificationToken.delete as any).mockResolvedValue({});
    const res = await GET(makeReq("t1"));
    expect(res.headers.get("location")).toContain("error=user_not_found");
  });

  it("redirects with already when user already verified", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", emailVerified: new Date() });
    (prisma.verificationToken.delete as any).mockResolvedValue({});
    const res = await GET(makeReq("t1"));
    expect(res.headers.get("location")).toContain("verified=already");
  });

  it("verifies user and redirects with success", async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: "t1", email: "a@b.de", expiresAt: new Date(Date.now() + 999999),
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", emailVerified: null });
    (prisma.user.update as any).mockResolvedValue({ id: "u1" });
    (prisma.verificationToken.delete as any).mockResolvedValue({});

    const res = await GET(makeReq("t1"));
    expect(res.headers.get("location")).toContain("verified=success");
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
