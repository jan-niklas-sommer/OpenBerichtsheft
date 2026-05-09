import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.notification.update as ReturnType<typeof vi.fn>;
const mockDelete = prisma.notification.delete as ReturnType<typeof vi.fn>;

const userSession = {
  user: { id: "user-1", role: "trainee", email: "user@test.de", name: "User" },
};

function makePutRequest(id: string = "notif-1"): NextRequest {
  return new NextRequest(`http://localhost:3000/api/notifications/${id}`, {
    method: "PUT",
  });
}

function makeDeleteRequest(id: string = "notif-1"): NextRequest {
  return new NextRequest(`http://localhost:3000/api/notifications/${id}`, {
    method: "DELETE",
  });
}

function makeParams(id: string = "notif-1") {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makePutRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it("marks notification as read", async () => {
    mockAuth.mockResolvedValue(userSession);
    mockUpdate.mockResolvedValue({ id: "notif-1", read: true });
    const res = await PUT(makePutRequest(), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.read).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
      data: { read: true },
    });
  });
});

describe("DELETE /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it("deletes notification", async () => {
    mockAuth.mockResolvedValue(userSession);
    mockDelete.mockResolvedValue({ id: "notif-1" });
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
    });
  });
});
