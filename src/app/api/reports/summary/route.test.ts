import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeTrainerAssignment: {
      findMany: vi.fn(),
    },
    traineeOfficerAssignment: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    weeklyReport: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockTrainerAssignments = prisma.traineeTrainerAssignment.findMany as ReturnType<typeof vi.fn>;
const mockOfficerAssignments = prisma.traineeOfficerAssignment.findMany as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockReportFindMany = prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const sampleTrainees = [
  { id: "trainee-1", name: "Alice", profession: { name: "Fachinformatiker" } },
  { id: "trainee-2", name: "Bob", profession: { name: "Elektroniker" } },
];

describe("GET /api/reports/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns all trainees for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue(sampleTrainees);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
    expect(json[0].traineeId).toBe("trainee-1");
    expect(json[1].traineeId).toBe("trainee-2");
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        role: "trainee",
        deactivatedAt: null,
      },
      select: {
        id: true,
        name: true,
        profession: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  });

  it("returns only assigned trainees for trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockTrainerAssignments.mockResolvedValue([
      { traineeId: "trainee-1" },
    ]);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].traineeId).toBe("trainee-1");
    expect(mockTrainerAssignments).toHaveBeenCalledWith({
      where: { trainerId: "trainer-1" },
    });
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        role: "trainee",
        deactivatedAt: null,
        id: { in: ["trainee-1"] },
      },
      select: {
        id: true,
        name: true,
        profession: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  });

  it("returns only assigned trainees for training_officer", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockOfficerAssignments.mockResolvedValue([
      { traineeId: "trainee-2" },
    ]);
    mockUserFindMany.mockResolvedValue([sampleTrainees[1]]);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].traineeId).toBe("trainee-2");
    expect(mockOfficerAssignments).toHaveBeenCalledWith({
      where: { trainingOfficerId: "officer-1" },
    });
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        role: "trainee",
        deactivatedAt: null,
        id: { in: ["trainee-2"] },
      },
      select: {
        id: true,
        name: true,
        profession: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  });

  it("returns empty array when no trainees are assigned", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockTrainerAssignments.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("calculates status counts correctly", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);
    mockReportFindMany.mockResolvedValue([
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 1, status: "approved" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 2, status: "approved" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 3, status: "submitted" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 4, status: "draft" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 5, status: "rejected" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 6, status: "needs_revision" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].totalReports).toBe(6);
    expect(json[0].approved).toBe(2);
    expect(json[0].submitted).toBe(1);
    expect(json[0].draft).toBe(1);
    expect(json[0].rejected).toBe(1);
    expect(json[0].needsRevision).toBe(1);
  });

  it("calculates completionPercent correctly", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const jan4 = new Date(currentYear, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1);
    const currentWeek = Math.ceil((now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const approvedReports = Array.from({ length: Math.max(1, Math.floor(currentWeek / 2)) }, (_, i) => ({
      traineeId: "trainee-1",
      calendarYear: currentYear,
      calendarWeek: i + 1,
      status: "approved",
    }));

    mockReportFindMany.mockResolvedValue(approvedReports);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0]).toBeDefined();
    const expectedPercent = Math.min(100, Math.round((approvedReports.length / currentWeek) * 100));
    expect(json[0].completionPercent).toBe(expectedPercent);
  });

  it("caps completionPercent at 100", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);

    const now = new Date();
    const currentYear = now.getFullYear();

    const manyApproved = Array.from({ length: 60 }, (_, i) => ({
      traineeId: "trainee-1",
      calendarYear: currentYear,
      calendarWeek: i + 1,
      status: "approved",
    }));

    mockReportFindMany.mockResolvedValue(manyApproved);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].completionPercent).toBe(100);
  });

  it("identifies missing weeks correctly", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const jan4 = new Date(currentYear, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1);
    const currentWeek = Math.ceil((now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const startWeek = Math.max(1, currentWeek - 12);

    mockReportFindMany.mockResolvedValue([
      { traineeId: "trainee-1", calendarYear: currentYear, calendarWeek: startWeek, status: "approved" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    const missing = json[0].missingWeeks;
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.every((w: { year: number; week: number }) => w.year === currentYear && w.week > startWeek && w.week <= currentWeek)).toBe(true);
  });

  it("returns empty missingWeeks when all weeks are covered", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const jan4 = new Date(currentYear, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1);
    const currentWeek = Math.ceil((now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const startWeek = Math.max(1, currentWeek - 12);
    const allWeeks = [];
    for (let w = startWeek; w <= currentWeek; w++) {
      allWeeks.push({ traineeId: "trainee-1", calendarYear: currentYear, calendarWeek: w, status: "approved" });
    }

    mockReportFindMany.mockResolvedValue(allWeeks);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].missingWeeks).toEqual([]);
  });

  it("includes profession name in result", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([sampleTrainees[0]]);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].profession).toBe("Fachinformatiker");
  });

  it("sets profession to null when trainee has no profession", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([{ id: "trainee-3", name: "NoProf", profession: null }]);
    mockReportFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json[0].profession).toBeNull();
  });

  it("handles multiple trainees with separate report counts", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue(sampleTrainees);
    mockReportFindMany.mockResolvedValue([
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 1, status: "approved" },
      { traineeId: "trainee-1", calendarYear: 2026, calendarWeek: 2, status: "approved" },
      { traineeId: "trainee-2", calendarYear: 2026, calendarWeek: 1, status: "draft" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
    const alice = json.find((t: { traineeId: string }) => t.traineeId === "trainee-1");
    const bob = json.find((t: { traineeId: string }) => t.traineeId === "trainee-2");
    expect(alice.totalReports).toBe(2);
    expect(alice.approved).toBe(2);
    expect(bob.totalReports).toBe(1);
    expect(bob.draft).toBe(1);
  });
});
