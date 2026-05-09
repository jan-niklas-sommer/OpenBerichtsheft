import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { PUT } from "./[id]/route";
import { POST as ANONYMIZE } from "./[id]/anonymize/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    trainerProfessionAssignment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockHash = bcrypt.hash as ReturnType<typeof vi.fn>;
const mockTrainerProfessions = prisma.trainerProfessionAssignment.findMany as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/users");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/users", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/users", () => {
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

  it("returns 403 for trainee", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns all users as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const users = [
      { id: "user-1", email: "a@b.com", name: "User 1", role: "trainee", professionId: null, profession: null, trainingStartDate: null, createdAt: "2025-01-01", deactivatedAt: null },
    ];
    mockFindMany.mockResolvedValue(users);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(users);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        professionId: true,
        profession: { select: { id: true, name: true } },
        trainingStartDate: true,
        createdAt: true,
        deactivatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("filters by role as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeGetRequest({ role: "trainee" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "trainee" },
      }),
    );
  });

  it("returns trainees for trainer by profession", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockTrainerProfessions.mockResolvedValue([{ professionId: "prof-1" }]);
    mockFindMany.mockResolvedValue([{ id: "t-1", name: "Trainee", email: "t@test.de" }]);
    const res = await GET(makeGetRequest({ role: "trainee" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([{ id: "t-1", name: "Trainee", email: "t@test.de" }]);
  });

  it("returns officers for trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindMany.mockResolvedValue([{ id: "o-1", name: "Officer", email: "o@test.de" }]);
    const res = await GET(makeGetRequest({ role: "training_officer" }));
    expect(res.status).toBe(200);
  });

  it("returns 403 for trainer without role filter", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
  });
});

describe("POST /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 for short password", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({
      email: "user@test.de",
      name: "Test User",
      role: "trainee",
      password: "short",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for invalid email", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({
      email: "bad",
      name: "Test User",
      role: "trainee",
      password: "12345678",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for missing name", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({
      email: "user@test.de",
      role: "trainee",
      password: "12345678",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 201 on successful creation", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockHash.mockResolvedValue("hashed-password");
    const createdUser = {
      id: "user-1",
      email: "new@test.de",
      name: "New User",
      role: "trainer",
      professionId: null,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockCreate.mockResolvedValue(createdUser);
    const res = await POST(makePostRequest({
      email: "new@test.de",
      name: "New User",
      role: "trainer",
      password: "12345678",
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(createdUser);
    expect(mockHash).toHaveBeenCalledWith("12345678", 12);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: "new@test.de",
        name: "New User",
        role: "trainer",
        passwordHash: "hashed-password",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        professionId: true,
        trainingStartDate: true,
        createdAt: true,
        deactivatedAt: true,
      },
    });
  });

  it("returns 201 with professionId for trainee", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const professionId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const createdUser = {
      id: "user-2",
      email: "trainee@test.de",
      name: "Trainee User",
      role: "trainee",
      professionId,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockCreate.mockResolvedValue(createdUser);
    const res = await POST(makePostRequest({
      email: "trainee@test.de",
      name: "Trainee User",
      role: "trainee",
      password: "12345678",
      professionId,
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(createdUser);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        professionId,
      }),
      select: expect.any(Object),
    });
  });

  it("creates trainee with trainingStartDate", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockHash.mockResolvedValue("hashed-password");
    const createdUser = {
      id: "user-3",
      email: "trainee@test.de",
      name: "New Trainee",
      role: "trainee",
      professionId: null,
      trainingStartDate: "2026-01-05T00:00:00.000Z",
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockCreate.mockResolvedValue(createdUser);
    const res = await POST(makePostRequest({
      email: "trainee@test.de",
      name: "New Trainee",
      role: "trainee",
      password: "12345678",
      trainingStartDate: "2026-01-05",
    }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        trainingStartDate: expect.any(Date),
      }),
      select: expect.any(Object),
    });
  });
});

describe("PUT /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makePutRequest(id: string, body: unknown): { req: NextRequest; params: Promise<{ id: string }> } {
    const req = new NextRequest(`http://localhost:3000/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return { req, params: Promise.resolve({ id }) };
  }

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const { req, params } = makePutRequest("user-1", { name: "Updated" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const { req, params } = makePutRequest("user-1", { name: "Updated" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("updates name successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const updatedUser = {
      id: "user-1",
      email: "user@test.de",
      name: "Updated Name",
      role: "trainee",
      professionId: null,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockUpdate.mockResolvedValue(updatedUser);
    const { req, params } = makePutRequest("user-1", { name: "Updated Name" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(updatedUser);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Updated Name" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        professionId: true,
        trainingStartDate: true,
        createdAt: true,
        deactivatedAt: true,
      },
    });
  });

  it("hashes password on update", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockHash.mockResolvedValue("new-hashed-password");
    const updatedUser = {
      id: "user-1",
      email: "user@test.de",
      name: "User",
      role: "trainee",
      professionId: null,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockUpdate.mockResolvedValue(updatedUser);
    const { req, params } = makePutRequest("user-1", { password: "newpassword123" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    expect(mockHash).toHaveBeenCalledWith("newpassword123", 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        passwordHash: "new-hashed-password",
      }),
      select: expect.any(Object),
    });
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.password).toBeUndefined();
  });

  it("returns 400 for invalid update body (bad email)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const { req, params } = makePutRequest("user-1", { email: "not-an-email" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for invalid role in update", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const { req, params } = makePutRequest("user-1", { role: "hacker" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for short password in update", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const { req, params } = makePutRequest("user-1", { password: "abc" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for empty name in update", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const { req, params } = makePutRequest("user-1", { name: "" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("updates professionId successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const professionId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const updatedUser = {
      id: "user-1",
      email: "user@test.de",
      name: "User",
      role: "trainee",
      professionId,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockUpdate.mockResolvedValue(updatedUser);
    const { req, params } = makePutRequest("user-1", { professionId });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { professionId },
      select: expect.any(Object),
    });
  });

  it("updates trainingStartDate", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const updatedUser = {
      id: "user-1",
      email: "user@test.de",
      name: "User",
      role: "trainee",
      professionId: null,
      trainingStartDate: "2026-01-05T00:00:00.000Z",
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockUpdate.mockResolvedValue(updatedUser);
    const { req, params } = makePutRequest("user-1", { trainingStartDate: "2026-01-05" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        trainingStartDate: expect.any(Date),
      }),
      select: expect.any(Object),
    });
  });

  it("clears trainingStartDate with null", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const updatedUser = {
      id: "user-1",
      email: "user@test.de",
      name: "User",
      role: "trainee",
      professionId: null,
      trainingStartDate: null,
      createdAt: "2025-01-01",
      deactivatedAt: null,
    };
    mockUpdate.mockResolvedValue(updatedUser);
    const { req, params } = makePutRequest("user-1", { trainingStartDate: null });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        trainingStartDate: null,
      }),
      select: expect.any(Object),
    });
  });
});

describe("POST /api/users/[id]/anonymize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeAnonymizeRequest(id: string): { req: NextRequest; params: Promise<{ id: string }> } {
    const req = new NextRequest(`http://localhost:3000/api/users/${id}/anonymize`, {
      method: "POST",
    });
    return { req, params: Promise.resolve({ id }) };
  }

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const { req, params } = makeAnonymizeRequest("user-1");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const { req, params } = makeAnonymizeRequest("user-1");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 404 when user not found", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(null);
    const { req, params } = makeAnonymizeRequest("nonexistent");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 400 when user not deactivated", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: null,
      deactivatedAt: null,
    });
    const { req, params } = makeAnonymizeRequest("user-1");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("User must be deactivated first");
  });

  it("returns 400 when already anonymized", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: new Date("2025-01-01"),
      deactivatedAt: new Date("2024-12-01"),
    });
    const { req, params } = makeAnonymizeRequest("user-1");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Already anonymized");
  });

  it("anonymizes user successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: null,
      deactivatedAt: new Date("2024-12-01"),
    });
    const anonymizedAt = new Date("2025-06-01T00:00:00.000Z");
    const anonymizedResult = {
      id: "user-1",
      name: "Anonym",
      email: "anonym-user-1@deleted",
      role: "trainee",
      anonymizedAt,
    };
    mockUpdate.mockResolvedValue(anonymizedResult);
    const { req, params } = makeAnonymizeRequest("user-1");
    const res = await ANONYMIZE(req, { params });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Anonym",
        email: "anonym-user-1@deleted",
        passwordHash: "-",
        professionId: null,
        anonymizedAt: expect.any(Date),
      },
      select: { id: true, name: true, email: true, role: true, anonymizedAt: true },
    });
  });
});
