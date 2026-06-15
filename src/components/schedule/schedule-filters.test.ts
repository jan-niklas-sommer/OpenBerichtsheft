import { describe, it, expect } from "vitest";
import { hasScheduleConflicts } from "./schedule-filters";
import type { ScheduleAssignmentView } from "./types";

function make(start: string, end: string, traineeId = "t1"): ScheduleAssignmentView {
  return {
    id: `${start}-${end}`,
    traineeId,
    scheduleType: "department",
    startDate: start,
    endDate: end,
    department: null,
    color: null,
    trainee: { id: traineeId, name: "X" },
    supervisor: null,
  };
}

describe("hasScheduleConflicts", () => {
  it("returns false for empty list", () => {
    expect(hasScheduleConflicts([])).toBe(false);
  });

  it("returns false for a single assignment", () => {
    expect(hasScheduleConflicts([make("2026-01-01", "2026-01-31")])).toBe(false);
  });

  it("returns false for non-overlapping assignments", () => {
    expect(hasScheduleConflicts([make("2026-01-01", "2026-01-10"), make("2026-02-01", "2026-02-10")])).toBe(false);
  });

  it("returns true for overlapping assignments", () => {
    expect(hasScheduleConflicts([make("2026-01-01", "2026-01-20"), make("2026-01-15", "2026-01-25")])).toBe(true);
  });

  it("returns true for touching boundaries (<=/>=)", () => {
    expect(hasScheduleConflicts([make("2026-01-01", "2026-01-10"), make("2026-01-10", "2026-01-20")])).toBe(true);
  });

  it("returns false for overlapping assignments of DIFFERENT trainees", () => {
    expect(
      hasScheduleConflicts([
        make("2026-01-01", "2026-01-20", "t1"),
        make("2026-01-10", "2026-01-25", "t2"),
      ]),
    ).toBe(false);
  });
});
