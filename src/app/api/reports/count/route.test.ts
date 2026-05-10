import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      count: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCount = prisma.weeklyReport.count as ReturnType<typeof vi.fn>;

const session = {
  user: { id: "trainee-1", role: "trainee", email: "t@test.de", name: "Trainee" },
};

function makeUrl(params: Record<string, string>): NextRequest {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/reports/count?${qs}`);
}

describe("GET /api/reports/count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(session);
    mockCount.mockResolvedValue(5);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing params", async () => {
    const res = await GET(makeUrl({}));
    expect(res.status).toBe(400);
  });

  it("returns count for valid params", async () => {
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(5);
  });

  it("filters by traineeId for trainee role", async () => {
    await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: "trainee-1" }),
      })
    );
  });

  it("returns 0 count", async () => {
    mockCount.mockResolvedValue(0);
    const res = await GET(makeUrl({ from: "2020-01-01", to: "2020-12-31" }));
    const data = await res.json();
    expect(data.count).toBe(0);
  });
});
