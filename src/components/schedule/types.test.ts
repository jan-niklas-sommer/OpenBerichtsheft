import { describe, it, expect } from "vitest";
import {
  generateWorkDays,
  computeBlocks,
  getTopAssignmentForDay,
} from "./types";
import type { ScheduleAssignmentView } from "./types";

function makeAssignment(overrides: Partial<ScheduleAssignmentView> & { id: string; traineeId: string }): ScheduleAssignmentView {
  return {
    scheduleType: "department",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    department: null,
    color: null,
    trainee: { id: "t1", name: "Test" },
    supervisor: null,
    ...overrides,
  };
}

describe("generateWorkDays", () => {
  it("filters out weekends", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-11");
    const days = generateWorkDays(start, end);
    expect(days.length).toBe(5);
    for (const d of days) {
      expect(d.getDay()).not.toBe(0);
      expect(d.getDay()).not.toBe(6);
    }
  });

  it("returns empty for same start/end", () => {
    const d = new Date("2026-05-04");
    expect(generateWorkDays(d, d)).toEqual([]);
  });

  it("returns single day if one weekday", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-05");
    expect(generateWorkDays(start, end)).toHaveLength(1);
  });

  it("handles range starting on saturday", () => {
    const start = new Date("2026-05-09");
    const end = new Date("2026-05-12");
    const days = generateWorkDays(start, end);
    expect(days.length).toBe(1);
    expect(days[0].getDay()).toBe(1);
  });

  it("handles range starting on sunday", () => {
    const start = new Date("2026-05-10");
    const end = new Date("2026-05-12");
    const days = generateWorkDays(start, end);
    expect(days.length).toBe(1);
    expect(days[0].getDay()).toBe(1);
  });
});

describe("computeBlocks", () => {
  const cellWidth = 6;

  it("returns empty for no workdays", () => {
    expect(computeBlocks("t1", [], [], cellWidth)).toEqual([]);
  });

  it("returns empty for no assignments", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-09");
    const workDays = generateWorkDays(start, end);
    expect(computeBlocks("t1", workDays, [], cellWidth)).toEqual([]);
  });

  it("creates a single block for a continuous assignment", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-09");
    const workDays = generateWorkDays(start, end);

    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const blocks = computeBlocks("t1", workDays, [assignment], cellWidth);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].assignment.id).toBe("a1");
    expect(blocks[0].startIndex).toBe(0);
    expect(blocks[0].endIndex).toBe(4);
    expect(blocks[0].width).toBe(5 * cellWidth);
    expect(blocks[0].offset).toBe(0);
  });

  it("creates multiple blocks for different assignments", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-16");
    const workDays = generateWorkDays(start, end);

    const a1 = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });
    const a2 = makeAssignment({
      id: "a2",
      traineeId: "t1",
      scheduleType: "school",
      startDate: "2026-05-11",
      endDate: "2026-05-15",
    });

    const blocks = computeBlocks("t1", workDays, [a1, a2], cellWidth);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].assignment.id).toBe("a1");
    expect(blocks[1].assignment.id).toBe("a2");
    expect(blocks[1].offset).toBe(blocks[0].width);
  });

  it("skips gaps between assignments", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-16");
    const workDays = generateWorkDays(start, end);

    const a1 = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-06",
    });

    const blocks = computeBlocks("t1", workDays, [a1], cellWidth);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].width).toBe(3 * cellWidth);
    expect(blocks[0].startIndex).toBe(0);
    expect(blocks[0].endIndex).toBe(2);
  });

  it("filters assignments by traineeId", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-09");
    const workDays = generateWorkDays(start, end);

    const a1 = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });
    const a2 = makeAssignment({
      id: "a2",
      traineeId: "t2",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const blocks = computeBlocks("t1", workDays, [a1, a2], cellWidth);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].assignment.id).toBe("a1");
  });

  it("handles assignment spanning only weekend (no workdays)", () => {
    const start = new Date("2026-05-04");
    const end = new Date("2026-05-09");
    const workDays = generateWorkDays(start, end);

    const a1 = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-09",
      endDate: "2026-05-10",
    });

    const blocks = computeBlocks("t1", workDays, [a1], cellWidth);
    expect(blocks).toHaveLength(0);
  });
});

describe("getTopAssignmentForDay", () => {
  it("returns null for no matching assignments", () => {
    const result = getTopAssignmentForDay("t1", new Date("2026-05-04"), []);
    expect(result).toBeNull();
  });

  it("returns highest priority assignment by layer order", () => {
    const dept = makeAssignment({
      id: "a1",
      traineeId: "t1",
      scheduleType: "department",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });
    const school = makeAssignment({
      id: "a2",
      traineeId: "t1",
      scheduleType: "school",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const result = getTopAssignmentForDay("t1", new Date("2026-05-06"), [dept, school]);
    expect(result!.id).toBe("a2");
  });
});
