import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeTrainerAssignment: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.traineeTrainerAssignment.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.traineeTrainerAssignment.upsert as ReturnType<typeof vi.fn>;
const mockDelete = prisma.traineeTrainerAssignment.delete as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

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
    traineeId: "550e8400-e29b-41d4-a716-446655440000",
    trainerId: "660e8400-e29b-41d4-a716-446655440001",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    trainee: { id: "550e8400-e29b-41d4-a716-446655440000", name: "Trainee", email: "trainee@test.de", role: "trainee" },
    trainer: { id: "660e8400-e29b-41d4-a716-446655440001", name: "Trainer", email: "trainer@test.de", role: "trainer" },
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

  it("returns assignments for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue(sampleAssignments);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleAssignments);
  });

  it("returns assignments for trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindMany.mockResolvedValue(sampleAssignments);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleAssignments);
  });
});

describe("POST /api/assignments", () => {
  const validBody = {
    traineeId: "550e8400-e29b-41d4-a716-446655440000",
    trainerId: "660e8400-e29b-41d4-a716-446655440001",
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
    const res = await POST(makePostRequest({ traineeId: "not-a-uuid", trainerId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when trainee not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return null;
      return { id: validBody.trainerId, role: "trainer" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainee");
  });

  it("returns 400 when trainee is not a trainee role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainer" };
      return { id: validBody.trainerId, role: "trainer" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainee");
  });

  it("returns 400 when trainer not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return null;
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainer");
  });

  it("returns 400 when trainer is not a trainer role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainerId, role: "trainee" };
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid trainer");
  });

  it("creates assignment successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === validBody.traineeId) return { id: validBody.traineeId, role: "trainee" };
      return { id: validBody.trainerId, role: "trainer" };
    });
    const created = {
      id: "assign-1",
      traineeId: validBody.traineeId,
      trainerId: validBody.trainerId,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      trainee: { id: validBody.traineeId, name: "Trainee", email: "t@test.de" },
      trainer: { id: validBody.trainerId, name: "Trainer", email: "tr@test.de" },
    };
    mockUpsert.mockResolvedValue(created);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(created);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        traineeId_trainerId: { traineeId: validBody.traineeId, trainerId: validBody.trainerId },
      },
      create: { traineeId: validBody.traineeId, trainerId: validBody.trainerId },
      update: {},
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });
  });
});

describe("DELETE /api/assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("assign-1"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainer role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await DELETE(makeDeleteRequest("assign-1"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await DELETE(makeDeleteRequest("assign-1"));
    expect(res.status).toBe(403);
  });

  it("returns 400 for missing id", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const req = new NextRequest("http://localhost:3000/api/assignments", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing id");
  });

  it("deletes assignment successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDelete.mockResolvedValue(undefined);
    const res = await DELETE(makeDeleteRequest("assign-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "assign-1" } });
  });
});
