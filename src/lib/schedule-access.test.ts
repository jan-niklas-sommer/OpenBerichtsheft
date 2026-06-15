/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    trainerProfessionAssignment: { findFirst: vi.fn() },
  },
}));

import { trainerCanAccessTrainee } from "./schedule-access";
import { prisma } from "@/lib/prisma";

describe("trainerCanAccessTrainee", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true for admin without any DB query", async () => {
    const result = await trainerCanAccessTrainee("a1", "admin", "t1");
    expect(result).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns false for non-trainer, non-admin roles", async () => {
    expect(await trainerCanAccessTrainee("x", "trainee", "t1")).toBe(false);
    expect(await trainerCanAccessTrainee("x", "training_officer", "t1")).toBe(false);
  });

  it("returns false when trainee does not exist", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await trainerCanAccessTrainee("tr1", "trainer", "missing");
    expect(result).toBe(false);
  });

  it("returns false when trainee has no profession", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ professionId: null });
    const result = await trainerCanAccessTrainee("tr1", "trainer", "t1");
    expect(result).toBe(false);
    expect(prisma.trainerProfessionAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("returns false when trainer is not assigned to the profession", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ professionId: "p1" });
    (prisma.trainerProfessionAssignment.findFirst as any).mockResolvedValue(null);
    const result = await trainerCanAccessTrainee("tr1", "trainer", "t1");
    expect(result).toBe(false);
  });

  it("returns true when trainer is assigned to the profession", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ professionId: "p1" });
    (prisma.trainerProfessionAssignment.findFirst as any).mockResolvedValue({ id: "pa1" });
    const result = await trainerCanAccessTrainee("tr1", "trainer", "t1");
    expect(result).toBe(true);
    expect(prisma.trainerProfessionAssignment.findFirst).toHaveBeenCalledWith({
      where: { trainerId: "tr1", professionId: "p1" },
    });
  });
});
