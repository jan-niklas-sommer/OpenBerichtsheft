import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

function makeRequest(id: string = "user-1"): NextRequest {
  return new NextRequest(`http://localhost:3000/api/users/${id}/anonymize`, {
    method: "POST",
  });
}

function makeParams(id: string = "user-1") {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/users/[id]/anonymize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing user", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 400 if already anonymized", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: new Date(),
      deactivatedAt: new Date(),
    });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("anonymized");
  });

  it("returns 400 if user is not deactivated", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: null,
      deactivatedAt: null,
    });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("deactivated");
  });

  it("anonymizes deactivated user successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      anonymizedAt: null,
      deactivatedAt: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: "user-1",
      name: "Anonym",
      email: "anonym-user-1@deleted",
      role: "trainee",
      anonymizedAt: new Date(),
    });

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Anonym");
    expect(json.email).toContain("anonym-");
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
