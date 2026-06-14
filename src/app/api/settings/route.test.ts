import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";
import { PUT } from "./route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.appSetting.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.appSetting.upsert as ReturnType<typeof vi.fn>;

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns settings with workingDays from db", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue([
      { key: "workingDays", value: JSON.stringify([1, 2, 3, 4, 5]) },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.workingDays).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns default workingDays when no settings exist", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.workingDays).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("PUT /api/settings", () => {
  function makePutRequest(body: unknown) {
    return new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }) as never;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makePutRequest({ workingDays: [1, 2, 3, 4, 5] }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await PUT(makePutRequest({ workingDays: [1, 2, 3, 4, 5] }));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid workingDays", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await PUT(makePutRequest({ workingDays: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid day numbers", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await PUT(makePutRequest({ workingDays: [7] }));
    expect(res.status).toBe(400);
  });

  it("updates workingDays successfully", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ key: "workingDays", value: JSON.stringify([1, 2, 3, 4, 5, 6]) });
    const res = await PUT(makePutRequest({ workingDays: [1, 2, 3, 4, 5, 6] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.workingDays).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { key: "workingDays" },
      update: { value: JSON.stringify([1, 2, 3, 4, 5, 6]) },
      create: { key: "workingDays", value: JSON.stringify([1, 2, 3, 4, 5, 6]) },
    });
  });

  it("accepts single working day", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ key: "workingDays", value: JSON.stringify([1]) });
    const res = await PUT(makePutRequest({ workingDays: [1] }));
    expect(res.status).toBe(200);
  });
});
