import { getWeekDates } from "./utils";

export type ScheduleType = "department" | "school" | "vacation" | "other";

export interface ResolvedEntry {
  date: Date;
  scheduleType: ScheduleType;
  department?: string;
  displayLabel?: string;
  supervisorId?: string;
}

export interface SingleAssignment {
  id: string;
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: Date;
  endDate: Date;
  department?: string;
  supervisorId?: string;
}

export interface RecurrenceRule {
  id: string;
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: Date;
  endDate: Date;
  weekDays: number;
  interval?: number;
  displayLabel?: string;
  department?: string;
  supervisorId?: string;
  createdAt: Date;
}

export interface RecurrenceException {
  id: string;
  ruleId: string;
  date: Date;
  reason?: string;
}

const SCHEDULE_TYPE_LAYER: Record<ScheduleType, number> = {
  school: 4,
  vacation: 3,
  other: 2,
  department: 1,
};

export function weekdayToBit(weekday: number): number {
  if (weekday < 1 || weekday > 7) {
    throw new RangeError(`weekday must be 1-7 (ISO), got ${weekday}`);
  }
  return 1 << (weekday - 1);
}

export function bitfieldContainsWeekday(bits: number, weekday: number): boolean {
  if (weekday < 1 || weekday > 7) {
    throw new RangeError(`weekday must be 1-7 (ISO), got ${weekday}`);
  }
  return (bits & (1 << (weekday - 1))) !== 0;
}

function normalizeDate(d: Date): Date {
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = normalizeDate(date);
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  return d >= s && d <= e;
}

function getIsoDayOfWeek(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

interface Candidate {
  scheduleType: ScheduleType;
  department?: string;
  displayLabel?: string;
  supervisorId?: string;
  layer: number;
  createdAt: Date;
}

export function resolveDay(
  date: Date,
  singleAssignments: SingleAssignment[],
  recurrenceRules: RecurrenceRule[],
  exceptions: RecurrenceException[],
): ResolvedEntry {
  const candidates: Candidate[] = [];
  const exceptionRuleIds = new Set(
    exceptions
      .filter((ex) => normalizeDate(ex.date).getTime() === normalizeDate(date).getTime())
      .map((ex) => ex.ruleId),
  );

  for (const assignment of singleAssignments) {
    if (isInRange(date, assignment.startDate, assignment.endDate)) {
      candidates.push({
        scheduleType: assignment.scheduleType,
        department: assignment.department,
        supervisorId: assignment.supervisorId,
        layer: SCHEDULE_TYPE_LAYER[assignment.scheduleType],
        createdAt: new Date(0),
      });
    }
  }

  for (const rule of recurrenceRules) {
    if (exceptionRuleIds.has(rule.id)) continue;
    if (!isInRange(date, rule.startDate, rule.endDate)) continue;
    const isoDay = getIsoDayOfWeek(date);
    if (!bitfieldContainsWeekday(rule.weekDays, isoDay)) continue;

    if ((rule.interval ?? 1) > 1) {
      const start = normalizeDate(rule.startDate);
      const target = normalizeDate(date);
      const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000);
      const dayOfWeekStart = getIsoDayOfWeek(start);
      let matchCount = 0;
      for (let d = 0; d <= diffDays; d++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + d);
        if (bitfieldContainsWeekday(rule.weekDays, getIsoDayOfWeek(checkDate))) {
          matchCount++;
        }
      }
      if (matchCount % (rule.interval ?? 1) !== 1) continue;
    }

    candidates.push({
      scheduleType: rule.scheduleType,
      department: rule.department,
      displayLabel: rule.displayLabel,
      supervisorId: rule.supervisorId,
      layer: SCHEDULE_TYPE_LAYER[rule.scheduleType],
      createdAt: rule.createdAt,
    });
  }

  if (candidates.length === 0) {
    return {
      date: normalizeDate(date),
      scheduleType: "department",
    };
  }

  candidates.sort((a, b) => {
    if (a.layer !== b.layer) return b.layer - a.layer;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const winner = candidates[0];
  return {
    date: normalizeDate(date),
    scheduleType: winner.scheduleType,
    department: winner.department,
    displayLabel: winner.displayLabel,
    supervisorId: winner.supervisorId,
  };
}

export function resolveWeek(
  year: number,
  week: number,
  singleAssignments: SingleAssignment[],
  recurrenceRules: RecurrenceRule[],
  exceptions: RecurrenceException[],
): ResolvedEntry[] {
  const dates = getWeekDates(year, week);
  return dates.map((date) => resolveDay(date, singleAssignments, recurrenceRules, exceptions));
}
