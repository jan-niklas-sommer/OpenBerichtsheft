/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeOfficerAssignment: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

import { DELETE } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const params = (id: string) => Promise.resolve({ id });
const req = () => ({}) as any;

const adminSession = { user: { id: "a1", role: "admin" } };
const trainerSession = { user: { id: "t1", role: "trainer" } };

describe("DELETE /api/officer-assignments/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req(), { params: params("oa1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    (auth as any).mockResolvedValue({ user: { id: "x", role: "trainee" } });
    const res = await DELETE(req(), { params: params("oa1") });
    expect(res.status).toBe(403);
  });

  it("returns 403 when trainer is not the owner", async () => {
    (auth as any).mockResolvedValue(trainerSession);
    (prisma.traineeOfficerAssignment.findUnique as any).mockResolvedValue({ assignedById: "other" });
    const res = await DELETE(req(), { params: params("oa1") });
    expect(res.status).toBe(403);
  });

  it("deletes as admin (200)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.traineeOfficerAssignment.delete as any).mockResolvedValue({ id: "oa1" });
    const res = await DELETE(req(), { params: params("oa1") });
    expect(res.status).toBe(200);
    expect(prisma.traineeOfficerAssignment.delete).toHaveBeenCalledWith({ where: { id: "oa1" } });
  });

  it("returns 404 when missing", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (prisma.traineeOfficerAssignment.delete as any).mockRejectedValue(new Error("not found"));
    const res = await DELETE(req(), { params: params("oa1") });
    expect(res.status).toBe(404);
  });
});
