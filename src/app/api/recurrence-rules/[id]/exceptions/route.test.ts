/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurrenceRule: { findUnique: vi.fn() },
    recurrenceException: { create: vi.fn(), delete: vi.fn() },
  },
}));

import { POST } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function makeReq(body: unknown, search = "") {
  return {
    json: async () => body,
    url: `http://localhost:3000/api/recurrence-rules/r1/exceptions${search}`,
  } as any;
}
const params = (id = "r1") => Promise.resolve({ id });

const adminSession = { user: { id: "a1", role: "admin" } };
const trainerSession = { user: { id: "t1", role: "trainer" } };
const traineeSession = { user: { id: "az1", role: "trainee" } };

describe("POST /api/recurrence-rules/[id]/exceptions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(makeReq({ date: "2025-01-13" }), { params: params() });
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    (auth as any).mockResolvedValue(traineeSession);
    const res = await POST(makeReq({ date: "2025-01-13" }), { params: params() });
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown rule", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeReq({ date: "2025-01-13" }), { params: params() });
    expect(res.status).toBe(404);
  });

  it("returns 403 when trainer does not own the rule", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({
      id: "r1", createdById: "other-trainer", startDate: new Date(), endDate: new Date(),
    });
    const res = await POST(makeReq({ date: "2025-01-13" }), { params: params() });
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid date", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({
      id: "r1", createdById: null, startDate: new Date(), endDate: new Date(),
    });
    const res = await POST(makeReq({ date: "not-a-date" }), { params: params() });
    expect(res.status).toBe(400);
  });

  it("creates exception (201) for admin", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({
      id: "r1", createdById: null, startDate: new Date(), endDate: new Date(),
    });
    (prisma.recurrenceException.create as any).mockResolvedValue({
      id: "e1", ruleId: "r1", date: new Date("2025-01-13"), reason: null,
    });
    const res = await POST(makeReq({ date: "2025-01-13", reason: "Feiertag" }), { params: params() });
    expect(res.status).toBe(201);
    expect(prisma.recurrenceException.create).toHaveBeenCalledWith({
      data: { ruleId: "r1", date: new Date("2025-01-13"), reason: "Feiertag" },
    });
  });

  it("returns 409 on duplicate exception date", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({
      id: "r1", createdById: null, startDate: new Date(), endDate: new Date(),
    });
    (prisma.recurrenceException.create as any).mockRejectedValue(new Error("unique constraint"));
    const res = await POST(makeReq({ date: "2025-01-13" }), { params: params() });
    expect(res.status).toBe(409);
  });
});
