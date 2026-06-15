/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurrenceRule: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    trainerProfessionAssignment: {
      findFirst: vi.fn(),
    },
  },
}));

import { PUT, DELETE } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminSession = { user: { id: "a1", role: "admin" } };
const trainerSession = { user: { id: "t1", role: "trainer" } };
const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

function makeReq(body: unknown) {
  return { json: async () => body } as any;
}
const params = (id: string) => Promise.resolve({ id });

function mockExistsForTrainee(traineeId = "tt1") {
  (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId });
  (prisma.user.findUnique as any).mockResolvedValue({ professionId: "p1" });
  (prisma.trainerProfessionAssignment.findFirst as any).mockResolvedValue({ id: "pa1" });
}

describe("PUT /api/recurrence-rules/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    (auth as any).mockResolvedValue({ user: { id: "x", role: "trainee" } });
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when rule does not exist", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue(null);
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when trainer is not assigned to the profession", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId: "tt1" });
    (prisma.user.findUnique as any).mockResolvedValue({ professionId: "p1" });
    (prisma.trainerProfessionAssignment.findFirst as any).mockResolvedValue(null);
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid scheduleType", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId: "tt1" });
    const res = await PUT(makeReq({ scheduleType: "invalid" }), { params: params(VALID_ID) });
    expect(res.status).toBe(400);
  });

  it("updates rule as admin (200)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId: "tt1" });
    (prisma.recurrenceRule.update as any).mockResolvedValue({ id: VALID_ID });
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(200);
    expect(prisma.recurrenceRule.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VALID_ID } }),
    );
  });

  it("updates rule as trainer with profession access (200)", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    mockExistsForTrainee();
    (prisma.recurrenceRule.update as any).mockResolvedValue({ id: VALID_ID });
    const res = await PUT(makeReq({ interval: 2 }), { params: params(VALID_ID) });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/recurrence-rules/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when rule does not exist", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue(null);
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when trainer is not assigned to profession", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId: "tt1" });
    (prisma.user.findUnique as any).mockResolvedValue({ professionId: "p1" });
    (prisma.trainerProfessionAssignment.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("deletes rule as admin (200)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.recurrenceRule.findUnique as any).mockResolvedValue({ traineeId: "tt1" });
    (prisma.recurrenceRule.delete as any).mockResolvedValue({ id: VALID_ID });
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(200);
    expect(prisma.recurrenceRule.delete).toHaveBeenCalledWith({ where: { id: VALID_ID } });
  });
});
