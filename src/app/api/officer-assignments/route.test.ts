import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeOfficerAssignment: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    traineeTrainerAssignment: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.traineeOfficerAssignment.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.traineeOfficerAssignment.upsert as ReturnType<typeof vi.fn>;
const mockDelete = prisma.traineeOfficerAssignment.delete as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.traineeOfficerAssignment.findUnique as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.traineeTrainerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const sampleAssignments = [
  {
    id: "oa-1",
    traineeId: "550e8400-e29b-41d4-a716-446655440000",
    trainingOfficerId: "770e8400-e29b-41d4-a716-446655440002",
    trainerId: "trainer-1",
    trainee: { id: "550e8400-e29b-41d4-a716-446655440000", name: "Trainee", email: "trainee@test.de" },
    trainingOfficer: { id: "770e8400-e29b-41d4-a716-446655440002", name: "Officer", email: "officer@test.de" },
    trainer: { id: "trainer-1", name: "Trainer" },
    createdAt: "2026-05-07T00:00:00.000Z",
  },
];

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/officer-assignments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/officer-assignments?id=${id}`, {
    method: "DELETE",
  });
}

describe("GET /api/officer-assignments", () => {
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

  it("returns 403 for training_officer role", async () => {
    mockAuth.mockResolvedValue(officerSession);
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns all assignments for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue(sampleAssignments);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleAssignments);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        trainingOfficer: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns only owned assignments for trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindMany.mockResolvedValue(sampleAssignments);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleAssignments);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { trainerId: "trainer-1" },
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        trainingOfficer: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/officer-assignments", () => {
  const validBody = {
    traineeId: "550e8400-e29b-41d4-a716-446655440000",
    trainingOfficerId: "770e8400-e29b-41d4-a716-446655440002",
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

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for training_officer role", async () => {
    mockAuth.mockResolvedValue(officerSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 for invalid body (missing fields)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for invalid UUIDs", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({ traineeId: "bad", trainingOfficerId: "bad" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when trainee not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return null;
      return { id: validBody.trainingOfficerId, role: "training_officer" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainee");
  });

  it("returns 400 when trainee is not trainee role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainer" };
      return { id: validBody.trainingOfficerId, role: "training_officer" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainee");
  });

  it("returns 400 when training officer not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return null;
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid training officer");
  });

  it("returns 400 when training officer is not training_officer role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainingOfficerId, role: "trainee" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid training officer");
  });

  it("returns 403 when trainer is not assigned to trainee", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainingOfficerId, role: "training_officer" };
    });
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Not assigned to this trainee");
  });

  it("creates assignment successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainingOfficerId, role: "training_officer" };
    });
    const created = {
      id: "oa-new",
      traineeId: validBody.traineeId,
      trainingOfficerId: validBody.trainingOfficerId,
      trainerId: "admin-1",
      trainee: { id: validBody.traineeId, name: "Trainee", email: "t@test.de" },
      trainingOfficer: { id: validBody.trainingOfficerId, name: "Officer", email: "o@test.de" },
    };
    mockUpsert.mockResolvedValue(created);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(created);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        traineeId_trainingOfficerId: { traineeId: validBody.traineeId, trainingOfficerId: validBody.trainingOfficerId },
      },
      create: { traineeId: validBody.traineeId, trainingOfficerId: validBody.trainingOfficerId, trainerId: "admin-1" },
      update: {},
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        trainingOfficer: { select: { id: true, name: true, email: true } },
      },
    });
  });

  it("creates assignment successfully as trainer with ownership", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockUserFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainingOfficerId, role: "training_officer" };
    });
    mockFindFirst.mockResolvedValue({ id: "tta-1", traineeId: validBody.traineeId, trainerId: "trainer-1" });
    const created = {
      id: "oa-new",
      traineeId: validBody.traineeId,
      trainingOfficerId: validBody.trainingOfficerId,
      trainerId: "trainer-1",
      trainee: { id: validBody.traineeId, name: "Trainee", email: "t@test.de" },
      trainingOfficer: { id: validBody.trainingOfficerId, name: "Officer", email: "o@test.de" },
    };
    mockUpsert.mockResolvedValue(created);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(created);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { traineeId: validBody.traineeId, trainerId: "trainer-1" },
    });
  });
});

describe("DELETE /api/officer-assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for training_officer role", async () => {
    mockAuth.mockResolvedValue(officerSession);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 for missing id", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const req = new NextRequest("http://localhost:3000/api/officer-assignments", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing id");
  });

  it("deletes assignment successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDelete.mockResolvedValue(undefined);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "oa-1" } });
  });

  it("deletes assignment successfully as trainer with ownership", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue({ id: "oa-1", trainerId: "trainer-1" });
    mockDelete.mockResolvedValue(undefined);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "oa-1" } });
  });

  it("returns 403 for trainer without ownership (assignment not found)", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for trainer without ownership (different trainer)", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue({ id: "oa-1", trainerId: "other-trainer" });
    const res = await DELETE(makeDeleteRequest("oa-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });
});
