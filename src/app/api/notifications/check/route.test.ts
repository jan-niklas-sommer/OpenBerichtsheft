import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/utils", () => ({
  getIsoWeek: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    weeklyReport: { findMany: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), createMany: vi.fn() },
  },
}));

import { getIsoWeek } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const mockGetIsoWeek = getIsoWeek as unknown as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockReportFindMany = prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>;
const mockNotifFindMany = prisma.notification.findMany as ReturnType<typeof vi.fn>;
const mockNotifCreate = prisma.notification.create as ReturnType<typeof vi.fn>;

function makeRequest(secret?: string) {
  const url = `http://localhost:3000/api/notifications/check${secret ? `?secret=${secret}` : ""}`;
  return new NextRequest(url, { method: "POST" });
}

describe("POST /api/notifications/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 10 });
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 403 for wrong secret", async () => {
    const res = await POST(makeRequest("wrong"));
    expect(res.status).toBe(403);
  });

  it("returns 403 without CRON_SECRET set", async () => {
    delete process.env.CRON_SECRET;
    mockUserFindMany.mockResolvedValue([]);
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it("creates notifications for missing reports", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "t-1", trainingStartDate: "2026-01-01" },
    ]);
    mockGetIsoWeek
      .mockReturnValueOnce({ year: 2026, week: 10 })
      .mockReturnValueOnce({ year: 2026, week: 1 });
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    mockNotifCreate.mockResolvedValue({ id: "n-1" });
    const res = await POST(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(2);
    expect(json.traineesChecked).toBe(1);
  });

  it("skips weeks before training start", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "t-1", trainingStartDate: "2026-03-01" },
    ]);
    mockGetIsoWeek
      .mockReturnValueOnce({ year: 2026, week: 10 })
      .mockReturnValueOnce({ year: 2026, week: 9 });
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    mockNotifCreate.mockResolvedValue({ id: "n-1" });
    const res = await POST(makeRequest("test-secret"));
    expect(res.status).toBe(200);
  });

  it("skips trainees with future training start year", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "t-1", trainingStartDate: "2028-01-01" },
    ]);
    mockGetIsoWeek
      .mockReturnValueOnce({ year: 2026, week: 10 })
      .mockReturnValueOnce({ year: 2028, week: 1 });
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    const res = await POST(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(0);
    expect(mockNotifCreate).not.toHaveBeenCalled();
  });

  it("does not duplicate notifications already sent", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "t-1", trainingStartDate: "2026-01-01" },
    ]);
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 10 });
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([
      { userId: "t-1", message: "Fehlender Wochenbericht für KW 8/2026" },
    ]);
    mockNotifCreate.mockResolvedValue({ id: "n-1" });
    const res = await POST(makeRequest("test-secret"));
    await res.json();
    const createdForKw8 = mockNotifCreate.mock.calls.some(
      (c: unknown[]) => (c as [{ data: { message: string } }])[0]?.data?.message?.includes("KW 8/2026")
    );
    expect(createdForKw8).toBe(false);
  });
});
