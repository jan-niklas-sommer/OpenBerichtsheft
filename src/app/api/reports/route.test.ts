import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    traineeTrainerAssignment: {
      findMany: vi.fn(),
    },
    traineeOfficerAssignment: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.weeklyReport.upsert as ReturnType<typeof vi.fn>;
const mockTrainerAssignments = prisma.traineeTrainerAssignment.findMany as ReturnType<typeof vi.fn>;
const mockOfficerAssignments = prisma.traineeOfficerAssignment.findMany as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
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

const sampleReports = [
  {
    id: "report-1",
    traineeId: "trainee-1",
    calendarYear: 2025,
    calendarWeek: 10,
    status: "draft",
    reportText: "Test",
    weekStartDate: "2025-03-03T00:00:00.000Z",
    weekEndDate: "2025-03-09T00:00:00.000Z",
    dailyEntries: [],
    trainee: { id: "trainee-1", name: "Trainee", profession: { id: "prof-1", name: "FISI" } },
  },
];

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/reports");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/reports", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns own reports as trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue(sampleReports);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleReports);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: "trainee-1" },
      }),
    );
  });

  it("returns assigned trainees reports as trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockTrainerAssignments.mockResolvedValue([{ traineeId: "trainee-1" }]);
    mockFindMany.mockResolvedValue(sampleReports);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleReports);
    expect(mockTrainerAssignments).toHaveBeenCalledWith({
      where: { trainerId: "trainer-1" },
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: { in: ["trainee-1"] } },
      }),
    );
  });

  it("returns assigned trainees reports as training_officer", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockOfficerAssignments.mockResolvedValue([{ traineeId: "trainee-1" }]);
    mockFindMany.mockResolvedValue(sampleReports);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleReports);
    expect(mockOfficerAssignments).toHaveBeenCalledWith({
      where: { trainingOfficerId: "officer-1" },
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: { in: ["trainee-1"] } },
      }),
    );
  });

  it("returns all reports as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue(sampleReports);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleReports);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it("applies status filter for trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest({ status: "draft" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: "trainee-1", status: "draft" },
      }),
    );
  });

  it("applies year filter for trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest({ year: "2025" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: "trainee-1", calendarYear: 2025 },
      }),
    );
  });

  it("applies status and year filters together for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest({ status: "submitted", year: "2025" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "submitted", calendarYear: 2025 },
      }),
    );
  });

  it("returns 403 for unknown role", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "unknown-1", role: "unknown", email: "unknown@test.de", name: "Unknown" },
    });
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });
});

describe("POST /api/reports", () => {
  const validBody = {
    calendarYear: 2025,
    calendarWeek: 10,
    reportText: "Bericht",
    dailyEntries: [
      { date: "2025-03-03", dayType: "company", hours: 8, minutes: 0 },
      { date: "2025-03-04", dayType: "company", hours: 8, minutes: 0 },
      { date: "2025-03-05", dayType: "vocational_school", hours: 8, minutes: 0 },
      { date: "2025-03-06", dayType: "company", hours: 8, minutes: 0 },
      { date: "2025-03-07", dayType: "company", hours: 6, minutes: 30 },
      { date: "2025-03-08", dayType: "vacation", hours: 0, minutes: 0 },
      { date: "2025-03-09", dayType: "other", hours: 0, minutes: 0 },
    ],
  };

  const upsertResult = {
    id: "report-1",
    traineeId: "trainee-1",
    calendarYear: 2025,
    calendarWeek: 10,
    status: "draft",
    reportText: "Bericht",
    dailyEntries: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-trainee role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for admin role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const invalidBody = {
      calendarYear: 2010,
      calendarWeek: 99,
      dailyEntries: [],
    };
    const res = await POST(makePostRequest(invalidBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for missing dailyEntries", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(
      makePostRequest({
        calendarYear: 2025,
        calendarWeek: 10,
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for invalid dayType", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(
      makePostRequest({
        calendarYear: 2025,
        calendarWeek: 10,
        dailyEntries: [{ date: "2025-03-03", dayType: "invalid", hours: 8, minutes: 0 }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative hours", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(
      makePostRequest({
        calendarYear: 2025,
        calendarWeek: 10,
        dailyEntries: [{ date: "2025-03-03", dayType: "company", hours: -1, minutes: 0 }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for minutes exceeding 59", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(
      makePostRequest({
        calendarYear: 2025,
        calendarWeek: 10,
        dailyEntries: [{ date: "2025-03-03", dayType: "company", hours: 8, minutes: 60 }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("creates report successfully as trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockUpsert.mockResolvedValue(upsertResult);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(upsertResult);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          traineeId_calendarYear_calendarWeek: {
            traineeId: "trainee-1",
            calendarYear: 2025,
            calendarWeek: 10,
          },
        },
        create: expect.objectContaining({
          traineeId: "trainee-1",
          calendarYear: 2025,
          calendarWeek: 10,
          reportText: "Bericht",
          status: "draft",
        }),
        update: expect.objectContaining({
          reportText: "Bericht",
        }),
      }),
    );
  });

  it("creates report without reportText", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const bodyWithoutText = {
      calendarYear: 2025,
      calendarWeek: 10,
      dailyEntries: validBody.dailyEntries,
    };
    mockUpsert.mockResolvedValue({ ...upsertResult, reportText: null });
    const res = await POST(makePostRequest(bodyWithoutText));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          reportText: null,
        }),
      }),
    );
  });
});
