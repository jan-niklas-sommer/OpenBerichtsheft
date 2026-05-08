import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, PUT } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    reviewEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      weeklyReport: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      reviewEvent: {
        create: vi.fn(),
      },
    })),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.weeklyReport.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.weeklyReport.update as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "t@test.de", name: "Trainee" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "tr@test.de", name: "Trainer" },
};

function makeRequest(id: string) {
  const url = `http://localhost:3000/api/reports/${id}/submit`;
  return new NextRequest(url, { method: "POST" });
}

function makePutRequest(id: string) {
  const url = `http://localhost:3000/api/reports/${id}/submit`;
  return new NextRequest(url, { method: "PUT" });
}

describe("POST /api/reports/[id]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-trainee", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 for other trainee's report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-2", status: "draft" });
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for already submitted report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "submitted" });
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for approved report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "approved" });
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(400);
  });

  it("submits draft report successfully", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const mockReport = { id: "r-1", traineeId: "trainee-1", status: "draft" };
    const mockUpdated = { ...mockReport, status: "submitted", submittedAt: new Date() };
    mockFindUnique.mockResolvedValue(mockReport);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(mockReport),
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
        reviewEvent: { create: vi.fn() },
      };
      return fn(tx);
    });
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("submitted");
  });

  it("submits needs_revision report successfully", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const mockReport = { id: "r-1", traineeId: "trainee-1", status: "needs_revision" };
    const mockUpdated = { ...mockReport, status: "submitted", submittedAt: new Date() };
    mockFindUnique.mockResolvedValue(mockReport);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(mockReport),
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
        reviewEvent: { create: vi.fn() },
      };
      return fn(tx);
    });
    const res = await POST(makeRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/reports/[id]/submit (withdraw)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-trainee", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 for other trainee's report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-2", status: "submitted" });
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for draft report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "draft" });
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for approved report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "approved" });
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(400);
  });

  it("withdraws submitted report successfully", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const mockReport = { id: "r-1", traineeId: "trainee-1", status: "submitted" };
    const mockUpdated = { ...mockReport, status: "draft", submittedAt: null };
    mockFindUnique.mockResolvedValue(mockReport);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue(mockReport),
          update: vi.fn().mockResolvedValue(mockUpdated),
        },
        reviewEvent: { create: vi.fn() },
      };
      return fn(tx);
    });
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("draft");
    expect(json.submittedAt).toBeNull();
  });

  it("returns 400 on race condition (status changed)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        weeklyReport: {
          findUnique: vi.fn().mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "approved" }),
          update: vi.fn(),
        },
        reviewEvent: { create: vi.fn() },
      };
      return fn(tx);
    });
    const res = await PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) });
    expect(res.status).toBe(400);
  });

  it("rethrows unexpected error on withdraw", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue({ id: "r-1", traineeId: "trainee-1", status: "submitted" });
    mockTransaction.mockRejectedValue(new Error("DB connection lost"));
    await expect(
      PUT(makePutRequest("r-1"), { params: Promise.resolve({ id: "r-1" }) })
    ).rejects.toThrow("DB connection lost");
  });
});
