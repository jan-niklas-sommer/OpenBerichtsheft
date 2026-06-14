/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    scheduleAssignment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe("PUT /api/schedule/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PUT(makeReq({ department: "HR" }), { params: params(VALID_ID) });
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    (auth as any).mockResolvedValue({ user: { id: "x", role: "trainee" } });
    const res = await PUT(makeReq({ department: "HR" }), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("returns 403 when trainer is not the owner", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.scheduleAssignment.findUnique as any).mockResolvedValue({ createdBy: "other" });
    const res = await PUT(makeReq({ department: "HR" }), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid scheduleType", async () => {
    (auth as any).mockResolvedValue(adminSession);
    const res = await PUT(makeReq({ scheduleType: "invalid" }), { params: params(VALID_ID) });
    expect(res.status).toBe(400);
  });

  it("updates assignment as admin (200)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.scheduleAssignment.update as any).mockResolvedValue({ id: VALID_ID, department: "HR" });
    const res = await PUT(makeReq({ department: "HR" }), { params: params(VALID_ID) });
    expect(res.status).toBe(200);
    expect(prisma.scheduleAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VALID_ID } }),
    );
  });
});

describe("DELETE /api/schedule/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(401);
  });

  it("returns 403 when trainer is not the owner", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.scheduleAssignment.findUnique as any).mockResolvedValue({ createdBy: "other" });
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it("deletes assignment as admin (200)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.scheduleAssignment.delete as any).mockResolvedValue({ id: VALID_ID });
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(200);
    expect(prisma.scheduleAssignment.delete).toHaveBeenCalledWith({ where: { id: VALID_ID } });
  });

  it("returns 404 when assignment missing", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.scheduleAssignment.delete as any).mockRejectedValue(new Error("not found"));
    const res = await DELETE(makeReq(null), { params: params(VALID_ID) });
    expect(res.status).toBe(404);
  });
});
