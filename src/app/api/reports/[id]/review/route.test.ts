import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findUnique: vi.fn(),
    },
    traineeTrainerAssignment: {
      findFirst: vi.fn(),
    },
    traineeOfficerAssignment: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.weeklyReport.findUnique as ReturnType<typeof vi.fn>;
const mockTrainerAssignment = prisma.traineeTrainerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockOfficerAssignment = prisma.traineeOfficerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const submittedReport = {
  id: "report-1",
  traineeId: "trainee-1",
  status: "submitted",
  calendarYear: 2025,
  calendarWeek: 10,
};

const updatedReport = {
  ...submittedReport,
  status: "approved",
  reviewedById: "trainer-1",
  reviewComment: null,
};

function makeRequest(body: unknown, id: string = "report-1"): NextRequest {
  return new NextRequest(`http://localhost:3000/api/reports/${id}/review`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id: string = "report-1") {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/reports/[id]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing report", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 400 if report is not submitted", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue({ ...submittedReport, status: "draft" });
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("reviewable");
  });

  it("returns 403 if trainer has no assignment", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue(null);
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 403 if officer has no assignment", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockOfficerAssignment.mockResolvedValue(null);
    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid action", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    const res = await POST(makeRequest({ action: "invalid" }), makeParams());
    expect(res.status).toBe(400);
  });

  it("approves report as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(submittedReport),
          update: vi.fn().mockResolvedValue(updatedReport),
        },
        reviewEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("approved");
  });

  it("rejects report with comment", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(submittedReport),
          update: vi.fn().mockResolvedValue({ ...updatedReport, status: "rejected", reviewComment: "Nicht gut" }),
        },
        reviewEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const res = await POST(makeRequest({ action: "rejected", comment: "Nicht gut" }), makeParams());
    expect(res.status).toBe(200);
  });

  it("returns needs_revision as trainer with assignment", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTrainerAssignment.mockResolvedValue({ id: "assign-1" });
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(submittedReport),
          update: vi.fn().mockResolvedValue({ ...updatedReport, status: "needs_revision" }),
        },
        reviewEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const res = await POST(makeRequest({ action: "needs_revision" }), makeParams());
    expect(res.status).toBe(200);
  });

  it("returns 400 if status changed during transaction", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(submittedReport);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue({ ...submittedReport, status: "draft" }),
          update: vi.fn(),
        },
        reviewEvent: { create: vi.fn() },
      };
      return fn(tx);
    });

    const res = await POST(makeRequest({ action: "approved" }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("reviewable");
  });
});
