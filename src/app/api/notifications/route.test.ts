import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { PUT as PutById, DELETE as DeleteById } from "./[id]/route";
import { POST as PostCheck } from "./check/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  getIsoWeek: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    weeklyReport: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIsoWeek } from "@/lib/utils";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetIsoWeek = getIsoWeek as unknown as ReturnType<typeof vi.fn>;
const mockNotifFindMany = prisma.notification.findMany as ReturnType<typeof vi.fn>;
const mockNotifCount = prisma.notification.count as ReturnType<typeof vi.fn>;
const mockNotifUpdate = prisma.notification.update as ReturnType<typeof vi.fn>;
const mockNotifDelete = prisma.notification.delete as ReturnType<typeof vi.fn>;
const mockNotifCreate = prisma.notification.create as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockReportFindMany = prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>;

const userSession = {
  user: { id: "user-1", role: "trainee", email: "user@test.de", name: "User" },
};

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

describe("GET /api/notifications", () => {
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

  it("returns notifications and unread count for authenticated user", async () => {
    mockAuth.mockResolvedValue(userSession);
    const notifications = [
      { id: "n-1", userId: "user-1", type: "missing_report", message: "Test", read: false, createdAt: "2026-01-01T00:00:00.000Z" },
    ];
    mockNotifFindMany.mockResolvedValue(notifications);
    mockNotifCount.mockResolvedValue(1);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.notifications).toEqual(notifications);
    expect(json.unreadCount).toBe(1);
    expect(mockNotifFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    expect(mockNotifCount).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
    });
  });
});

describe("PUT /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/notifications/n-1", { method: "PUT" });
    const res = await PutById(req, { params: Promise.resolve({ id: "n-1" }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("marks notification as read", async () => {
    mockAuth.mockResolvedValue(userSession);
    const updated = { id: "n-1", userId: "user-1", type: "missing_report", message: "Test", read: true, createdAt: "2026-01-01T00:00:00.000Z" };
    mockNotifUpdate.mockResolvedValue(updated);
    const req = new NextRequest("http://localhost:3000/api/notifications/n-1", { method: "PUT" });
    const res = await PutById(req, { params: Promise.resolve({ id: "n-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(updated);
    expect(mockNotifUpdate).toHaveBeenCalledWith({
      where: { id: "n-1", userId: "user-1" },
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
    const req = new NextRequest("http://localhost:3000/api/notifications/n-1", { method: "DELETE" });
    const res = await DeleteById(req, { params: Promise.resolve({ id: "n-1" }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("deletes notification", async () => {
    mockAuth.mockResolvedValue(userSession);
    mockNotifDelete.mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost:3000/api/notifications/n-1", { method: "DELETE" });
    const res = await DeleteById(req, { params: Promise.resolve({ id: "n-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockNotifDelete).toHaveBeenCalledWith({
      where: { id: "n-1", userId: "user-1" },
    });
  });
});

describe("POST /api/notifications/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 18 });
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 for non-admin role", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 for invalid cron secret", async () => {
    process.env.CRON_SECRET = "my-secret";
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/notifications/check?secret=wrong", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Invalid secret");
    delete process.env.CRON_SECRET;
  });

  it("creates notifications for missing weeks", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([{ id: "trainee-1", trainingStartDate: null }]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    mockNotifCreate.mockResolvedValue({});
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.traineesChecked).toBe(1);
    expect(json.created).toBeGreaterThan(0);
    expect(mockNotifCreate).toHaveBeenCalled();
  });

  it("respects deduplication of recent notifications", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 18 });
    mockUserFindMany.mockResolvedValue([{ id: "trainee-1", trainingStartDate: null }]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([
      { userId: "trainee-1", message: "KW 16/2026" },
    ]);
    mockNotifCreate.mockResolvedValue({});
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    const existingWeekMsg = "Fehlender Wochenbericht für KW 16/2026";
    const hasDup = mockNotifCreate.mock.calls.some(
      (call: unknown[]) => (call[0] as { data?: { message?: string } })?.data?.message === existingWeekMsg,
    );
    expect(hasDup).toBe(false);
  });

  it("skips weeks that already have reports", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 18 });
    mockUserFindMany.mockResolvedValue([{ id: "trainee-1", trainingStartDate: null }]);
    mockReportFindMany.mockResolvedValue([
      { traineeId: "trainee-1", calendarWeek: 16 },
      { traineeId: "trainee-1", calendarWeek: 17 },
    ]);
    mockNotifFindMany.mockResolvedValue([]);
    mockNotifCreate.mockResolvedValue({});
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(0);
    expect(mockNotifCreate).not.toHaveBeenCalled();
  });

  it("returns 0 created when no trainees exist", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(0);
    expect(json.traineesChecked).toBe(0);
  });

  it("accepts valid cron secret", async () => {
    process.env.CRON_SECRET = "my-secret";
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    const req = new NextRequest("http://localhost:3000/api/notifications/check?secret=my-secret", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    delete process.env.CRON_SECRET;
  });

  it("skips weeks before training start date", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetIsoWeek.mockReturnValue({ year: 2026, week: 18 });
    mockUserFindMany.mockResolvedValue([{ id: "trainee-1", trainingStartDate: new Date("2026-05-01") }]);
    mockReportFindMany.mockResolvedValue([]);
    mockNotifFindMany.mockResolvedValue([]);
    mockNotifCreate.mockResolvedValue({});
    const req = new NextRequest("http://localhost:3000/api/notifications/check", { method: "POST" });
    const res = await PostCheck(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.traineesChecked).toBe(1);
  });
});
