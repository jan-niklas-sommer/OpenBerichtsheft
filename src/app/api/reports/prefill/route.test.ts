import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scheduleAssignment: {
      findMany: vi.fn(),
    },
    recurrenceRule: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/report-builder", () => ({
  buildDefaultEntries: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  getWeekDates: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDefaultEntries } from "@/lib/report-builder";
import { getWeekDates } from "@/lib/utils";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockScheduleFindMany = prisma.scheduleAssignment.findMany as ReturnType<typeof vi.fn>;
const mockRuleFindMany = prisma.recurrenceRule.findMany as ReturnType<typeof vi.fn>;
const mockBuildDefaultEntries = buildDefaultEntries as ReturnType<typeof vi.fn>;
const mockGetWeekDates = getWeekDates as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "e68ee10b-4c07-48b5-b071-c5ea06138f79", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const trainerSession = {
  user: { id: "d1e0bec8-586c-46e2-9434-73f6f7cf3e96", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const mockWeekDates = [
  new Date("2026-05-04"),
  new Date("2026-05-05"),
  new Date("2026-05-06"),
  new Date("2026-05-07"),
  new Date("2026-05-08"),
  new Date("2026-05-09"),
  new Date("2026-05-10"),
];

const defaultEntries = [
  { date: "2026-05-04", dayType: "company", hours: 8, minutes: 0, reportText: "" },
  { date: "2026-05-05", dayType: "company", hours: 8, minutes: 0, reportText: "" },
  { date: "2026-05-06", dayType: "company", hours: 8, minutes: 0, reportText: "" },
  { date: "2026-05-07", dayType: "company", hours: 8, minutes: 0, reportText: "" },
  { date: "2026-05-08", dayType: "company", hours: 8, minutes: 0, reportText: "" },
  { date: "2026-05-09", dayType: "company", hours: 0, minutes: 0, reportText: "" },
  { date: "2026-05-10", dayType: "company", hours: 0, minutes: 0, reportText: "" },
];

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/reports/prefill");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url.toString());
}

describe("GET /api/reports/prefill", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest({ year: "2026", week: "19" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-trainee roles", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    const res = await GET(makeRequest({ year: "2026", week: "19" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when year is missing", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET(makeRequest({ week: "19" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when week is missing", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET(makeRequest({ year: "2026" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid year", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET(makeRequest({ year: "2019", week: "19" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid week", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    const res = await GET(makeRequest({ year: "2026", week: "54" }));
    expect(res.status).toBe(400);
  });

  it("returns prefill entries for valid request", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockGetWeekDates.mockReturnValue(mockWeekDates);
    mockScheduleFindMany.mockResolvedValue([]);
    mockRuleFindMany.mockResolvedValue([]);
    mockBuildDefaultEntries.mockReturnValue(defaultEntries);

    const res = await GET(makeRequest({ year: "2026", week: "19" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(defaultEntries);
  });

  it("passes schedule assignments to buildDefaultEntries", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockGetWeekDates.mockReturnValue(mockWeekDates);

    const assignment = {
      id: "assign-1",
      traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
      scheduleType: "department",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-31"),
      department: "Entwicklung",
      supervisorId: null,
    };
    mockScheduleFindMany.mockResolvedValue([assignment]);
    mockRuleFindMany.mockResolvedValue([]);
    mockBuildDefaultEntries.mockReturnValue(defaultEntries);

    await GET(makeRequest({ year: "2026", week: "19" }));

    expect(mockBuildDefaultEntries).toHaveBeenCalledWith(
      2026,
      19,
      expect.arrayContaining([
        expect.objectContaining({
          id: "assign-1",
          scheduleType: "department",
        }),
      ]),
      [],
      [],
    );
  });

  it("passes recurrence rules and exceptions to buildDefaultEntries", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockGetWeekDates.mockReturnValue(mockWeekDates);

    mockScheduleFindMany.mockResolvedValue([]);
    const rule = {
      id: "rule-1",
      traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
      scheduleType: "school",
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-06-30"),
      weekDays: 31,
      displayLabel: "Berufsschule",
      department: null,
      supervisorId: null,
      createdAt: new Date("2026-01-01"),
      exceptions: [
        { id: "ex-1", ruleId: "rule-1", date: new Date("2026-05-06"), reason: "Feiertag" },
      ],
    };
    mockRuleFindMany.mockResolvedValue([rule]);
    mockBuildDefaultEntries.mockReturnValue(defaultEntries);

    await GET(makeRequest({ year: "2026", week: "19" }));

    expect(mockBuildDefaultEntries).toHaveBeenCalledWith(
      2026,
      19,
      [],
      expect.arrayContaining([
        expect.objectContaining({ id: "rule-1", scheduleType: "school" }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: "ex-1", ruleId: "rule-1" }),
      ]),
    );
  });

  it("queries schedule assignments with correct date range", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockGetWeekDates.mockReturnValue(mockWeekDates);
    mockScheduleFindMany.mockResolvedValue([]);
    mockRuleFindMany.mockResolvedValue([]);
    mockBuildDefaultEntries.mockReturnValue(defaultEntries);

    await GET(makeRequest({ year: "2026", week: "19" }));

    expect(mockScheduleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          traineeId: "e68ee10b-4c07-48b5-b071-c5ea06138f79",
          startDate: { lte: mockWeekDates[6] },
          endDate: { gte: mockWeekDates[0] },
        }),
      }),
    );
  });
});
