import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trainerProfessionAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    traineeOfficerAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    scheduleAssignment: {
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
const mockProfessions = prisma.trainerProfessionAssignment.findMany as ReturnType<typeof vi.fn>;
const mockProfessionFindFirst = prisma.trainerProfessionAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockOfficerFindFirst = prisma.traineeOfficerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockOfficerCreate = prisma.traineeOfficerAssignment.create as ReturnType<typeof vi.fn>;
const mockScheduleFindMany = prisma.scheduleAssignment.findMany as ReturnType<typeof vi.fn>;
const mockScheduleCreate = prisma.scheduleAssignment.create as ReturnType<typeof vi.fn>;
const mockScheduleUpdate = prisma.scheduleAssignment.update as ReturnType<typeof vi.fn>;
const mockScheduleDelete = prisma.scheduleAssignment.delete as ReturnType<typeof vi.fn>;
const mockScheduleFindUnique = prisma.scheduleAssignment.findUnique as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "d9cb8b9c-c892-4955-bd18-7b8d2fb23617", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "d1e0bec8-586c-46e2-9434-73f6f7cf3e96", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const traineeSession = {
  user: { id: "e68ee10b-4c07-48b5-b071-c5ea06138f79", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/schedule");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/schedule", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePutRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/schedule", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/schedule?id=${id}`, { method: "DELETE" });
}

describe("GET /api/schedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns schedule for trainee (own)", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockScheduleFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    expect(mockScheduleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: traineeSession.user.id }),
      })
    );
  });

  it("returns schedule as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockScheduleFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
  });

  it("returns schedule for trainer by profession", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockProfessions.mockResolvedValue([{ professionId: "7278d0c1-f0ac-4c32-8f27-109d253ee699" }]);
    mockUserFindMany.mockResolvedValue([{ id: "e68ee10b-4c07-48b5-b071-c5ea06138f79" }]);
    mockScheduleFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
  });
});

describe("POST /api/schedule", () => {
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

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it("rejects assignment for non-trainee user", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ id: "officer-id", role: "training_officer" });
    const res = await POST(makePostRequest({
      traineeId: "officer-id",
      scheduleType: "department",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      department: "IT",
    }));
    expect(res.status).toBe(400);
  });

  it("creates assignment as admin", async () => {
    const traineeId = "e68ee10b-4c07-48b5-b071-c5ea06138f79";
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ id: traineeId, role: "trainee", professionId: null });
    mockScheduleCreate.mockResolvedValue({
      id: "sa-1",
      traineeId,
      scheduleType: "department",
      department: "IT",
      trainee: { id: traineeId, name: "Anna", email: "a@test.de" },
      supervisor: null,
    });
    const res = await POST(makePostRequest({
      traineeId,
      scheduleType: "department",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      department: "IT",
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.department).toBe("IT");
  });

  it("auto-creates officer assignment when supervisor is training_officer", async () => {
    const traineeId = "e68ee10b-4c07-48b5-b071-c5ea06138f79";
    const officerId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    const profId = "7278d0c1-f0ac-4c32-8f27-109d253ee699";

    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique
      .mockResolvedValueOnce({ id: traineeId, role: "trainee", professionId: profId })
      .mockResolvedValueOnce({ role: "training_officer" });
    mockProfessions.mockResolvedValue([{ professionId: profId }]);
    mockProfessionFindFirst.mockResolvedValue({ id: "tpa-1", trainerId: trainerSession.user.id, professionId: profId });
    mockScheduleCreate.mockResolvedValue({
      id: "sa-1",
      traineeId,
      supervisorId: officerId,
      scheduleType: "department",
      trainee: { id: traineeId, name: "Anna", email: "a@test.de" },
      supervisor: { id: officerId, name: "Officer", email: "o@test.de" },
    });
    mockOfficerFindFirst.mockResolvedValue(null);
    mockOfficerCreate.mockResolvedValue({ id: "oa-1" });

    const res = await POST(makePostRequest({
      traineeId,
      scheduleType: "department",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      supervisorId: officerId,
      department: "IT",
    }));
    expect(res.status).toBe(201);
    expect(mockOfficerCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        traineeId,
        trainingOfficerId: officerId,
      }),
    });
  });
});

describe("PUT /api/schedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makePutRequest({ id: "sa-1" }));
    expect(res.status).toBe(401);
  });

  it("updates assignment as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockScheduleUpdate.mockResolvedValue({ id: "sa-1", department: "HR" });
    const res = await PUT(makePutRequest({ id: "sa-1", department: "HR" }));
    expect(res.status).toBe(200);
  });

  it("returns 403 for trainer not owner", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockScheduleFindUnique.mockResolvedValue({ id: "sa-1", createdBy: "other-trainer" });
    const res = await PUT(makePutRequest({ id: "sa-1", department: "HR" }));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/schedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("sa-1"));
    expect(res.status).toBe(401);
  });

  it("deletes assignment as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockScheduleDelete.mockResolvedValue({ id: "sa-1" });
    const res = await DELETE(makeDeleteRequest("sa-1"));
    expect(res.status).toBe(200);
  });
});
