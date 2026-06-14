/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    trainerProfessionAssignment: { delete: vi.fn() },
  },
}));

import { DELETE } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const params = (id: string) => Promise.resolve({ id });
const req = () => ({}) as any;

describe("DELETE /api/assignments/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req(), { params: params("a1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "t1", role: "trainer" } });
    const res = await DELETE(req(), { params: params("a1") });
    expect(res.status).toBe(403);
  });

  it("deletes as admin (200)", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "admin" } });
    (prisma.trainerProfessionAssignment.delete as any).mockResolvedValue({ id: "a1" });
    const res = await DELETE(req(), { params: params("a1") });
    expect(res.status).toBe(200);
    expect(prisma.trainerProfessionAssignment.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
  });

  it("returns 404 when missing", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "admin" } });
    (prisma.trainerProfessionAssignment.delete as any).mockRejectedValue(new Error("not found"));
    const res = await DELETE(req(), { params: params("a1") });
    expect(res.status).toBe(404);
  });
});
