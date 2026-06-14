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
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    trainingProfession: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.trainerProfessionAssignment.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.trainerProfessionAssignment.upsert as ReturnType<typeof vi.fn>;
const mockDelete = prisma.trainerProfessionAssignment.delete as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockProfessionFindUnique = prisma.trainingProfession.findUnique as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const sampleAssignments = [
  {
    id: "assign-1",
    trainerId: "660e8400-e29b-41d4-a716-446655440001",
    professionId: "770e8400-e29b-41d4-a716-446655440002",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    trainer: { id: "660e8400-e29b-41d4-a716-446655440001", name: "Trainer", email: "trainer@test.de", role: "trainer" },
    profession: { id: "770e8400-e29b-41d4-a716-446655440002", name: "FISI" },
  },
];

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/assignments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/assignments?id=${id}`, {
    method: "DELETE",
  });
}

describe("GET /api/assignments", () => {
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

  it("returns 403 for trainer role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns assignments for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue(sampleAssignments);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleAssignments);
  });
});

describe("POST /api/assignments", () => {
  const validBody = {
    trainerId: "660e8400-e29b-41d4-a716-446655440001",
    professionId: "770e8400-e29b-41d4-a716-446655440002",
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

  it("returns 403 for trainer role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
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
    const res = await POST(makePostRequest({ trainerId: "not-a-uuid", professionId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when trainer not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue(null);
    mockProfessionFindUnique.mockResolvedValue({ id: validBody.professionId, name: "FISI" });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainer");
  });

  it("returns 400 when trainer is not a trainer role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ id: validBody.trainerId, role: "trainee" });
    mockProfessionFindUnique.mockResolvedValue({ id: validBody.professionId, name: "FISI" });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainer");
  });

  it("returns 400 when profession not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ id: validBody.trainerId, role: "trainer" });
    mockProfessionFindUnique.mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid profession");
  });

  it("creates assignment successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ id: validBody.trainerId, role: "trainer" });
    mockProfessionFindUnique.mockResolvedValue({ id: validBody.professionId, name: "FISI" });
    const created = {
      id: "assign-1",
      trainerId: validBody.trainerId,
      professionId: validBody.professionId,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      trainer: { id: validBody.trainerId, name: "Trainer", email: "tr@test.de" },
      profession: { id: validBody.professionId, name: "FISI" },
    };
    mockUpsert.mockResolvedValue(created);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(created);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        trainerId_professionId: { trainerId: validBody.trainerId, professionId: validBody.professionId },
      },
      create: { trainerId: validBody.trainerId, professionId: validBody.professionId },
      update: {},
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        profession: { select: { id: true, name: true } },
      },
    });
  });
});
