import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "./route";
import { POST as SUBMIT } from "./submit/route";
import { POST as REVIEW } from "./review/route";

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    weeklyReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    reviewEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    traineeTrainerAssignment: {
      findFirst: vi.fn(),
    },
    traineeOfficerAssignment: {
      findFirst: vi.fn(),
    },
    reviewEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.weeklyReport.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.weeklyReport.update as ReturnType<typeof vi.fn>;
const mockTrainerAssignment = prisma.traineeTrainerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockOfficerAssignment = prisma.traineeOfficerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const otherTraineeSession = {
  user: { id: "trainee-2", role: "trainee", email: "trainee2@test.de", name: "Trainee 2" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const baseReport = {
  id: "report-1",
  traineeId: "trainee-1",
  weekStartDate: "2025-03-02T23:00:00.000Z",
  weekEndDate: "2025-03-08T23:00:00.000Z",
  calendarYear: 2025,
  calendarWeek: 10,
  status: "draft",
  reportText: "Test report",
  submittedAt: null,
  reviewedAt: null,
  reviewedById: null,
  reviewComment: null,
  createdAt: "2025-03-02T00:00:00.000Z",
  updatedAt: "2025-03-02T00:00:00.000Z",
  dailyEntries: [
    { id: "entry-1", weeklyReportId: "report-1", date: "2025-03-03T00:00:00.000Z", dayType: "company", hours: 8, minutes: 0, createdAt: "2025-03-02T00:00:00.000Z", updatedAt: "2025-03-02T00:00:00.000Z" },
  ],
  trainee: { id: "trainee-1", name: "Trainee", email: "trainee@test.de", profession: { id: "prof-1", name: "FISI" } },
  reviewedBy: null,
};

const flatReport = {
  id: "report-1",
  traineeId: "trainee-1",
  weekStartDate: "2025-03-02T23:00:00.000Z",
  weekEndDate: "2025-03-08T23:00:00.000Z",
  calendarYear: 2025,
  calendarWeek: 10,
  status: "draft",
  reportText: "Test report",
  submittedAt: null,
  reviewedAt: null,
  reviewedById: null,
  reviewComment: null,
  createdAt: "2025-03-02T00:00:00.000Z",
  updatedAt: "2025-03-02T00:00:00.000Z",
};

function makeRequest(method: string = "GET", body?: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/reports/report-1", {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });
}

const params = Promise.resolve({ id: "report-1" });

describe("GET /api/reports/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when report not found", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 403 when trainee accesses other trainee's report", async () => {
    mockAuth.mockResolvedValue(otherTraineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 when trainee accesses own report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(baseReport);
  });

  it("returns 200 when trainer accesses assigned trainee's report", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(baseReport);
  });

  it("returns 403 when trainer accesses unassigned trainee's report", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockTrainerAssignment.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 when training_officer accesses assigned report", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockOfficerAssignment.mockResolvedValue({ id: "assignment-1" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(baseReport);
  });

  it("returns 403 when training_officer accesses unassigned report", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockOfficerAssignment.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 when admin accesses any report", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(baseReport);
  });
});

describe("PUT /api/reports/[id]", () => {
  const validBody = {
    reportText: "Updated report",
    dailyEntries: [
      { date: "2025-03-03", dayType: "company", hours: 8, minutes: 0 },
      { date: "2025-03-04", dayType: "vocational_school", hours: 6, minutes: 30 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-trainee role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 404 when report not found", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 403 when trainee accesses other trainee's report", async () => {
    mockAuth.mockResolvedValue(otherTraineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when report is not editable (submitted status)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ ...baseReport, status: "submitted" });
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Report is not editable");
  });

  it("returns 400 for validation failure", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await PUT(
      makeRequest("PUT", { dailyEntries: [{ date: "2025-03-03", dayType: "invalid", hours: -1, minutes: 60 }] }),
      { params },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("updates report successfully", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const updatedReport = { ...baseReport, reportText: "Updated report" };
    mockUpdate.mockResolvedValue(updatedReport);
    const res = await PUT(makeRequest("PUT", validBody), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(updatedReport);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-1" },
        data: expect.objectContaining({ reportText: "Updated report" }),
      }),
    );
  });

  it("sets reportText to null when empty string is provided", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const updatedReport = { ...baseReport, reportText: null };
    mockUpdate.mockResolvedValue(updatedReport);
    const res = await PUT(makeRequest("PUT", { reportText: "", dailyEntries: validBody.dailyEntries }), { params });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-1" },
        data: expect.objectContaining({ reportText: null }),
      }),
    );
  });
});

describe("POST /api/reports/[id]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-trainee", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 404 when report not found", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 403 when trainee submits other trainee's report", async () => {
    mockAuth.mockResolvedValue(otherTraineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when report is already submitted", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ ...baseReport, status: "submitted" });
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot submit");
  });

  it("submits draft report successfully (draft → submitted)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const submittedReport = { ...flatReport, status: "submitted", submittedAt: "2025-03-10T00:00:00.000Z", updatedAt: "2025-03-10T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(flatReport);
    mockTx.weeklyReport.update.mockResolvedValue(submittedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(submittedReport);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-1" },
        data: expect.objectContaining({ status: "submitted" }),
      }),
    );
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weeklyReportId: "report-1",
          actorId: "trainee-1",
          action: "submitted",
        }),
      }),
    );
  });

  it("returns 400 when transaction re-check finds report deleted (locked = null)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockTx.weeklyReport.findUnique.mockResolvedValue(null);
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot submit");
  });

  it("returns 400 when transaction re-check finds status changed to submitted", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockTx.weeklyReport.findUnique.mockResolvedValue({ ...baseReport, status: "submitted" });
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot submit");
  });

  it("re-throws unexpected transaction errors", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockTransaction.mockRejectedValueOnce(new Error("DB connection lost"));
    await expect(SUBMIT(makeRequest("POST"), { params })).rejects.toThrow("DB connection lost");
  });

  it("submits needs_revision report successfully (needs_revision → submitted)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const revisionReport = { ...flatReport, status: "needs_revision" };
    mockFindUnique.mockResolvedValue(revisionReport);
    const submittedReport = { ...flatReport, status: "submitted", submittedAt: "2025-03-10T00:00:00.000Z", updatedAt: "2025-03-10T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(revisionReport);
    mockTx.weeklyReport.update.mockResolvedValue(submittedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await SUBMIT(makeRequest("POST"), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(submittedReport);
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "submitted",
          actorId: "trainee-1",
        }),
      }),
    );
  });
});

describe("POST /api/reports/[id]/review", () => {
  const submittedReport = { ...flatReport, status: "submitted", submittedAt: "2025-03-10T00:00:00.000Z" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for unassigned trainer on review", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue(null);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 404 when report not found for review", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 400 when report is not in submitted status", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Report is not in reviewable state");
  });

  it("returns 400 for invalid action", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const res = await REVIEW(makeRequest("POST", { action: "invalid_action" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("approves submitted report (submitted → approved)", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const approvedReport = { ...flatReport, status: "approved", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "trainer-1", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(approvedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(approvedReport);
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "approved", reviewedById: "trainer-1" }),
      }),
    );
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weeklyReportId: "report-1",
          actorId: "trainer-1",
          action: "approved",
        }),
      }),
    );
  });

  it("marks report as needs_revision (submitted → needs_revision)", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const revisionReport = { ...flatReport, status: "needs_revision", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "trainer-1", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(revisionReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "needs_revision" }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(revisionReport);
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "needs_revision" }),
      }),
    );
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "needs_revision" }),
      }),
    );
  });

  it("rejects submitted report (submitted → rejected)", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const rejectedReport = { ...flatReport, status: "rejected", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "trainer-1", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(rejectedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "rejected" }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(rejectedReport);
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "rejected" }),
      }),
    );
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "rejected" }),
      }),
    );
  });

  it("returns 403 when training_officer is not assigned to trainee", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockOfficerAssignment.mockResolvedValue(null);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("allows training_officer to review assigned report", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockOfficerAssignment.mockResolvedValue({ id: "assignment-1" });
    const approvedReport = { ...flatReport, status: "approved", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "officer-1", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(approvedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(200);
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "approved", reviewedById: "officer-1" }),
      }),
    );
  });

  it("allows admin to review any report without assignment check", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    const approvedReport = { ...flatReport, status: "approved", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "admin-1", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(approvedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(200);
    expect(mockTrainerAssignment).not.toHaveBeenCalled();
    expect(mockOfficerAssignment).not.toHaveBeenCalled();
  });

  it("returns 400 when transaction re-check finds report deleted", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    mockTx.weeklyReport.findUnique.mockResolvedValue(null);
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Report is not in reviewable state");
  });

  it("returns 400 when transaction re-check finds status changed", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    mockTx.weeklyReport.findUnique.mockResolvedValue({ ...flatReport, status: "approved" });
    const res = await REVIEW(makeRequest("POST", { action: "approved" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Report is not in reviewable state");
  });

  it("re-throws unexpected transaction errors in review", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    mockTransaction.mockRejectedValueOnce(new Error("DB error"));
    await expect(REVIEW(makeRequest("POST", { action: "approved" }), { params })).rejects.toThrow("DB error");
  });

  it("approves with comment", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assignment-1" });
    const approvedReport = { ...flatReport, status: "approved", submittedAt: "2025-03-10T00:00:00.000Z", reviewedAt: "2025-03-11T00:00:00.000Z", reviewedById: "trainer-1", reviewComment: "Well done", updatedAt: "2025-03-11T00:00:00.000Z" };
    mockTx.weeklyReport.findUnique.mockResolvedValue(submittedReport);
    mockTx.weeklyReport.update.mockResolvedValue(approvedReport);
    mockTx.reviewEvent.create.mockResolvedValue({});
    const res = await REVIEW(makeRequest("POST", { action: "approved", comment: "Well done" }), { params });
    expect(res.status).toBe(200);
    expect(mockTx.weeklyReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewComment: "Well done" }),
      }),
    );
    expect(mockTx.reviewEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ comment: "Well done" }),
      }),
    );
  });
});
