/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurrenceRule: { findUnique: vi.fn() },
    recurrenceException: { delete: vi.fn() },
  },
}));

import { DELETE } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminSession = { user: { id: "a1", role: "admin" } };
const trainerSession = { user: { id: "t1", role: "trainer" } };
const params = (ruleId = "r1", exceptionId = "e1") =>
  Promise.resolve({ id: ruleId, exceptionId });

describe("DELETE /api/recurrence-rules/[id]/exceptions/[exceptionId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE({} as any, { params: params() });
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    (auth as any).mockResolvedValue({ user: { id: "x", role: "trainee" } });
    const res = await DELETE({} as any, { params: params() });
    expect(res.status).toBe(403);
  });

  it("returns 403 when trainer does not own the rule", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ createdById: "other" });
    const res = await DELETE({} as any, { params: params() });
    expect(res.status).toBe(403);
  });

  it("deletes exception for admin (compound where)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceException.delete as any).mockResolvedValue({});
    const res = await DELETE({} as any, { params: params("r1", "e1") });
    expect(res.status).toBe(200);
    expect(prisma.recurrenceException.delete).toHaveBeenCalledWith({ where: { id: "e1", ruleId: "r1" } });
  });

  it("returns 404 when exception belongs to a different rule (cross-rule guard)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceException.delete as any).mockRejectedValue(new Error("P2025"));
    const res = await DELETE({} as any, { params: params() });
    expect(res.status).toBe(404);
  });

  it("returns 404 when exception missing", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceException.delete as any).mockRejectedValue(new Error("not found"));
    const res = await DELETE({} as any, { params: params() });
    expect(res.status).toBe(404);
  });
});
