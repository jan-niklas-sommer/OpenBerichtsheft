import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trainerProfessionAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    traineeOfficerAssignment: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    recurrenceRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockProfessionFindMany = prisma.trainerProfessionAssignment.findMany as ReturnType<typeof vi.fn>;
const mockProfessionFindFirst = prisma.trainerProfessionAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.recurrenceRule.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.recurrenceRule.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.recurrenceRule.update as ReturnType<typeof vi.fn>;
const mockDelete = prisma.recurrenceRule.delete as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.recurrenceRule.findUnique as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "d9cb8b9c-c892-4955-bd18-7b8d2fb23617", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "d1e0bec8-586c-46e2-9434-73f6f7cf3e96", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const traineeSession = {
  user: { id: "e68ee10b-4c07-48b5-b071-c5ea06138f79", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const officerSession = {
  user: { id: "a1b2c3d4-5678-9012-abcd-ef0123456789", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const sampleRule = {
  id: "rule-1",
  traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
  scheduleType: "department",
  startDate: new Date("2026-01-05"),
  endDate: new Date("2026-06-30"),
  weekDays: 31,
  displayLabel: "Abteilung A",
  department: "Entwicklung",
  supervisorId: null,
  createdById: "d1e0bec8-586c-46e2-9434-73f6f7cf3e96",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  trainee: { id: "e68ee10b-4c07-48b5-b071-c5ea06138f79", name: "Trainee", profession: { name: "FiAE" } },
  supervisor: null,
  exceptions: [],
};

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/recurrence-rules");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/recurrence-rules", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/recurrence-rules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns all rules for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue([sampleRule]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("rule-1");
    expect(json[0].scheduleType).toBe("department");
  });

  it("filters by traineeId for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue([sampleRule]);
    const res = await GET(makeGetRequest({ traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79" }),
      }),
    );
  });

  it("returns filtered rules for trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockProfessionFindMany.mockResolvedValue([{ professionId: "prof-1" }]);
    mockUserFindMany.mockResolvedValue([{ id: "e68ee10b-4c07-48b5-b071-c5ea06138f79" }]);
    mockFindMany.mockResolvedValue([sampleRule]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: { in: ["e68ee10b-4c07-48b5-b071-c5ea06138f79"] } }),
      }),
    );
  });

  it("returns own rules for trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue([sampleRule]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79" },
      }),
    );
  });

  it("returns rules for training_officer", async () => {
    mockAuth.mockResolvedValue(officerSession);
    (prisma.traineeOfficerAssignment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { traineeId: "trainee-1" },
    ]);
    mockFindMany.mockResolvedValue([sampleRule]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
  });
});

describe("POST /api/recurrence-rules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(403);
  });

  it("returns 403 for training_officer", async () => {
    mockAuth.mockResolvedValue(officerSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid body", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({ scheduleType: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("creates rule as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValue(sampleRule);
    const res = await POST(
      makePostRequest({
        traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
        scheduleType: "department",
        startDate: "2026-01-05",
        endDate: "2026-06-30",
        weekDays: [1, 2, 3, 4, 5],
      }),
    );
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
          scheduleType: "department",
          weekDays: 31,
        }),
      }),
    );
  });

  it("creates rule with weekDays as bitfield number", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValue(sampleRule);
    const res = await POST(
      makePostRequest({
        traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
        scheduleType: "school",
        startDate: "2026-01-05",
        endDate: "2026-06-30",
        weekDays: 31,
      }),
    );
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ weekDays: 31 }),
      }),
    );
  });

  it("returns 403 for trainer not assigned to trainee profession", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique.mockResolvedValue({ professionId: "prof-1" });
    mockProfessionFindFirst.mockResolvedValue(null);
    const res = await POST(
      makePostRequest({
        traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
        scheduleType: "department",
        startDate: "2026-01-05",
        endDate: "2026-06-30",
        weekDays: [1, 2, 3, 4, 5],
      }),
    );
    expect(res.status).toBe(403);
  });

  it("creates rule as trainer with valid assignment", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique.mockResolvedValue({ professionId: "prof-1" });
    mockProfessionFindFirst.mockResolvedValue({ id: "assign-1" });
    mockCreate.mockResolvedValue(sampleRule);
    const res = await POST(
      makePostRequest({
        traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
        scheduleType: "department",
        startDate: "2026-01-05",
        endDate: "2026-06-30",
        weekDays: [1, 2, 3, 4, 5],
      }),
    );
    expect(res.status).toBe(201);
  });

  it("returns 403 when trainee has no profession", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique.mockResolvedValue({ professionId: null });
    const res = await POST(
      makePostRequest({
        traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
        scheduleType: "department",
        startDate: "2026-01-05",
        endDate: "2026-06-30",
        weekDays: [1, 2, 3, 4, 5],
      }),
    );
    expect(res.status).toBe(403);
  });
});
