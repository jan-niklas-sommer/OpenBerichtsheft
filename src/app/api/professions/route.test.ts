import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trainingProfession: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.trainingProfession.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.trainingProfession.create as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/professions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/professions", () => {
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

  it("returns 403 for non-admin role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns professions list for admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const professions = [
      { id: "prof-1", name: "FISI", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z", _count: { users: 5 } },
      { id: "prof-2", name: "FIAE", createdAt: "2025-01-02T00:00:00.000Z", updatedAt: "2025-01-02T00:00:00.000Z", _count: { users: 3 } },
    ];
    mockFindMany.mockResolvedValue(professions);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(professions);
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
  });
});

describe("POST /api/professions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest({ name: "FISI" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-admin role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await POST(makePostRequest({ name: "FISI" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 for empty name", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({ name: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for missing name", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for name exceeding 200 chars", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makePostRequest({ name: "a".repeat(201) }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("creates profession successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const created = { id: "prof-1", name: "FISI", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" };
    mockCreate.mockResolvedValue(created);
    const res = await POST(makePostRequest({ name: "FISI" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(created);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: "FISI" },
    });
  });
});
