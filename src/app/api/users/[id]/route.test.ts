import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-pw"),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const updatedUser = {
  id: "user-1",
  email: "test@test.de",
  name: "Test User",
  role: "trainee",
  professionId: null,
  trainingStartDate: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  deactivatedAt: null,
};

function makeRequest(body: unknown, id: string = "user-1"): NextRequest {
  return new NextRequest(`http://localhost:3000/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id: string = "user-1") {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeRequest({ name: "Test" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await PUT(makeRequest({ name: "Test" }), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await PUT(makeRequest({ email: "invalid" }), makeParams());
    expect(res.status).toBe(400);
  });

  it("updates user name successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue({ ...updatedUser, name: "New Name" });
    const res = await PUT(makeRequest({ name: "New Name" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("New Name");
  });

  it("hashes password when provided", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue(updatedUser);
    const res = await PUT(makeRequest({ password: "newpassword123" }), makeParams());
    expect(res.status).toBe(200);
    const { hashPassword } = await import("@/lib/password");
    expect(hashPassword).toHaveBeenCalledWith("newpassword123");
  });

  it("updates trainingStartDate", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue({ ...updatedUser, trainingStartDate: "2026-01-05T00:00:00.000Z" });
    const res = await PUT(makeRequest({ trainingStartDate: "2026-01-05" }), makeParams());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trainingStartDate: expect.any(Date),
        }),
      }),
    );
  });

  it("clears trainingStartDate with null", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue({ ...updatedUser, trainingStartDate: null });
    const res = await PUT(makeRequest({ trainingStartDate: null }), makeParams());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trainingStartDate: null,
        }),
      }),
    );
  });

  it("updates role", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpdate.mockResolvedValue({ ...updatedUser, role: "trainer" });
    const res = await PUT(makeRequest({ role: "trainer" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.role).toBe("trainer");
  });
});
