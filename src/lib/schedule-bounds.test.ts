import { describe, it, expect } from "vitest";
import { computeDataBounds } from "./schedule-bounds";

function makeAssignment(start: string, end: string) {
  return {
    id: "1",
    traineeId: "t1",
    scheduleType: "department" as const,
    startDate: start,
    endDate: end,
    department: null,
    color: null,
    supervisor: null,
    createdBy: "a1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    trainee: { id: "t1", name: "Test", profession: null },
  };
}

describe("computeDataBounds", () => {
  it("returns null for empty array", () => {
    expect(computeDataBounds([])).toBeNull();
  });

  it("computes bounds from single assignment", () => {
    const result = computeDataBounds([makeAssignment("2026-03-02", "2026-05-29")]);
    expect(result).not.toBeNull();
    expect(result!.start <= new Date("2026-03-02")).toBe(true);
    expect(result!.end >= new Date("2026-05-29")).toBe(true);
  });

  it("computes bounds from multiple assignments", () => {
    const result = computeDataBounds([
      makeAssignment("2026-01-06", "2026-02-28"),
      makeAssignment("2026-06-01", "2026-08-31"),
    ]);
    expect(result!.start <= new Date("2026-01-06")).toBe(true);
    expect(result!.end >= new Date("2026-08-31")).toBe(true);
  });

  it("start is a Monday", () => {
    const result = computeDataBounds([makeAssignment("2026-05-13", "2026-05-20")]);
    expect(result!.start.getDay()).toBe(1);
  });

  it("end is a Sunday", () => {
    const result = computeDataBounds([makeAssignment("2026-05-13", "2026-05-20")]);
    expect(result!.end.getDay()).toBe(0);
  });

  it("includes today when data is in the past", () => {
    const result = computeDataBounds([makeAssignment("2025-01-06", "2025-03-28")]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result!.end >= today).toBe(true);
  });

  it("includes today when data is in the future", () => {
    const result = computeDataBounds([makeAssignment("2028-01-03", "2028-06-30")]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result!.start <= today).toBe(true);
  });

  it("minBound is before start and maxBound is after end", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const past = new Date(today.getTime() - 90 * 86400000).toISOString().slice(0, 10);
    const future = new Date(today.getTime() + 90 * 86400000).toISOString().slice(0, 10);
    const result = computeDataBounds([makeAssignment(past, future)]);
    expect(result!.minBound < result!.start).toBe(true);
    expect(result!.maxBound > result!.end).toBe(true);
  });
});

