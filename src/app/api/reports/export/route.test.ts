import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    trainerProfessionAssignment: {
      findFirst: vi.fn(),
    },
    traineeOfficerAssignment: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToStream: vi.fn().mockResolvedValue({
    on: vi.fn((event: string, cb: (chunk?: Buffer) => void) => {
      if (event === "data") cb(Buffer.from("pdf"));
      if (event === "end") cb();
    }),
  }),
}));

vi.mock("@/components/reports/pdf-document", () => ({
  PdfBatchDocument: vi.fn(() => null),
}));

import { NextRequest } from "next/server";
import { GET } from "./route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "t@test.de", name: "Trainee" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "tr@test.de", name: "Trainer" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "o@test.de", name: "Officer" },
};

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "a@test.de", name: "Admin" },
};

const mockReports = [
  {
    id: "r1",
    calendarWeek: 1,
    calendarYear: 2026,
    weekStartDate: new Date("2026-01-05"),
    weekEndDate: new Date("2026-01-11"),
    reportText: "Test",
    reportType: "weekly",
    status: "approved",
    submittedAt: new Date("2026-01-09"),
    reviewedAt: new Date("2026-01-10"),
    reviewComment: null,
    traineeId: "trainee-1",
    trainee: { id: "trainee-1", name: "Trainee", profession: { id: "p1", name: "FiSi" } },
    reviewedBy: { id: "trainer-1", name: "Trainer" },
    dailyEntries: [
      { id: "d1", date: new Date("2026-01-05"), dayType: "company", hours: 8, minutes: 0, reportText: null, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function makeUrl(params: Record<string, string>): NextRequest {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/reports/export?${qs}`);
}

describe("GET /api/reports/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(traineeSession);
    mockFindMany.mockResolvedValue(mockReports);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing date params", async () => {
    const res = await GET(makeUrl({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await GET(makeUrl({ from: "not-a-date", to: "2026-12-31" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when from > to", async () => {
    const res = await GET(makeUrl({ from: "2026-12-31", to: "2026-01-01" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no reports found", async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET(makeUrl({ from: "2020-01-01", to: "2020-12-31" }));
    expect(res.status).toBe(404);
  });

  it("returns PDF for trainee (own reports)", async () => {
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("filters by traineeId for trainee role", async () => {
    await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: "trainee-1" }),
      })
    );
  });

  it("returns 400 when trainer missing traineeId", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when trainer not assigned to trainee", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ professionId: "p1" });
    (prisma.trainerProfessionAssignment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31", traineeId: "trainee-1" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when officer missing traineeId", async () => {
    mockAuth.mockResolvedValue(officerSession);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when officer not assigned", async () => {
    mockAuth.mockResolvedValue(officerSession);
    (prisma.traineeOfficerAssignment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31", traineeId: "trainee-1" }));
    expect(res.status).toBe(403);
  });

  it("admin can export all reports without traineeId", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31" }));
    expect(res.status).toBe(200);
  });

  it("admin can export specific trainee with traineeId", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await GET(makeUrl({ from: "2026-01-01", to: "2026-12-31", traineeId: "trainee-1" }));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traineeId: "trainee-1" }),
      })
    );
  });
});
