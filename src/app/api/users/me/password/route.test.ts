import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockCompare = verifyPassword as ReturnType<typeof vi.fn>;
const mockHash = hashPassword as ReturnType<typeof vi.fn>;

const session = {
  user: { id: "user-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/users/me/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/users/me/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(session);
    mockFindUnique.mockResolvedValue({ passwordHash: "old-hash", email: "u@test.de" });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue("new-hashed-pw");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("changes password successfully", async () => {
    const res = await PUT(makeRequest({
      currentPassword: "oldpassword123",
      newPassword: "newpassword456",
      confirmPassword: "newpassword456",
    }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockCompare).toHaveBeenCalledWith("oldpassword123", "old-hash");
    expect(mockHash).toHaveBeenCalledWith("newpassword456");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-hashed-pw" },
    });
  });

  it("returns 400 when current password is wrong", async () => {
    mockCompare.mockResolvedValue(false);
    const res = await PUT(makeRequest({
      currentPassword: "wrongpassword",
      newPassword: "newpassword456",
      confirmPassword: "newpassword456",
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("falsch");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for validation failure (short password)", async () => {
    const res = await PUT(makeRequest({
      currentPassword: "oldpassword123",
      newPassword: "short",
      confirmPassword: "short",
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when passwords do not match", async () => {
    const res = await PUT(makeRequest({
      currentPassword: "oldpassword123",
      newPassword: "newpassword456",
      confirmPassword: "different789",
    }));

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when new password equals current", async () => {
    const res = await PUT(makeRequest({
      currentPassword: "samepassword",
      newPassword: "samepassword",
      confirmPassword: "samepassword",
    }));

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when user not found in DB", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await PUT(makeRequest({
      currentPassword: "oldpassword123",
      newPassword: "newpassword456",
      confirmPassword: "newpassword456",
    }));

    expect(res.status).toBe(404);
  });

  it("returns 400 when currentPassword is missing", async () => {
    const res = await PUT(makeRequest({
      newPassword: "newpassword456",
      confirmPassword: "newpassword456",
    }));

    expect(res.status).toBe(400);
  });
});
