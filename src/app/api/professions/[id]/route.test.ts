import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trainingProfession: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.trainingProfession.update as ReturnType<typeof vi.fn>;
const mockDelete = prisma.trainingProfession.delete as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

function makePutRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000/api/professions/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/professions/${id}`, {
    method: "DELETE",
  });
}

describe("PUT /api/professions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const req = makePutRequest("prof-1", { name: "Updated" });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainer role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const req = makePutRequest("prof-1", { name: "Updated" });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const req = makePutRequest("prof-1", { name: "Updated" });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 for validation failure (empty name)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const req = makePutRequest("prof-1", { name: "" });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for validation failure (missing name)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const req = makePutRequest("prof-1", {});
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 for validation failure (name too long)", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const req = makePutRequest("prof-1", { name: "a".repeat(201) });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("updates profession successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue({ id: "prof-1", name: "Fachinformatiker Systemintegration" });
    const req = makePutRequest("prof-1", { name: "Fachinformatiker Systemintegration" });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("prof-1");
    expect(json.name).toBe("Fachinformatiker Systemintegration");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prof-1" },
      data: { name: "Fachinformatiker Systemintegration" },
    });
  });

  it("updates profession with max length name", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const longName = "a".repeat(200);
    mockUpdate.mockResolvedValue({ id: "prof-1", name: longName });
    const req = makePutRequest("prof-1", { name: longName });
    const res = await PUT(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prof-1" },
      data: { name: longName },
    });
  });
});

describe("DELETE /api/professions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const req = makeDeleteRequest("prof-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for trainer role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const req = makeDeleteRequest("prof-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for trainee role", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const req = makeDeleteRequest("prof-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("deletes profession successfully as admin", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDelete.mockResolvedValue(undefined);
    const req = makeDeleteRequest("prof-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "prof-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "prof-1" } });
  });
});
