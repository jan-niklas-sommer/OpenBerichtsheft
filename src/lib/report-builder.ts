import { getWeekDates } from "./utils";
import { resolveWeek, type ScheduleType, type SingleAssignment, type RecurrenceRule, type RecurrenceException } from "./schedule-resolver";

const SCHEDULE_TO_DAY_TYPE: Record<ScheduleType, "company" | "vocational_school" | "vacation" | "other"> = {
  department: "company",
  school: "vocational_school",
  vacation: "vacation",
  other: "other",
};

export interface DefaultDailyEntry {
  date: string;
  dayType: "company" | "vocational_school" | "vacation" | "other";
  hours: number;
  minutes: number;
  reportText: string;
}

export function buildDefaultEntries(
  year: number,
  week: number,
  singleAssignments: SingleAssignment[],
  recurrenceRules: RecurrenceRule[],
  exceptions: RecurrenceException[],
): DefaultDailyEntry[] {
  const resolved = resolveWeek(year, week, singleAssignments, recurrenceRules, exceptions);

  return resolved.map((entry) => {
    const d = entry.date;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return {
      date: dateStr,
      dayType: SCHEDULE_TO_DAY_TYPE[entry.scheduleType],
      hours: 8,
      minutes: 0,
      reportText: "",
    };
  });
}
