import { expandRuleToDays } from "@/lib/schedule-resolver";
import type { ScheduleAssignmentView, ScheduleType } from "./types";

export interface RecurrenceRuleExpandInput {
  id: string;
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate: string;
  weekDays: number;
  interval?: number;
  department?: string | null;
  trainee: { id: string; name: string; profession?: { name: string } | null };
  supervisor?: { id: string; name: string } | null;
  exceptions?: { id: string; ruleId: string; date: Date | string }[];
}

function toLocalIsoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function expandRulesToViews(
  rules: RecurrenceRuleExpandInput[],
  rangeStart: Date,
  rangeEnd: Date,
): ScheduleAssignmentView[] {
  const views: ScheduleAssignmentView[] = [];

  for (const rule of rules) {
    const exceptions = (rule.exceptions ?? []).map((e) => ({
      id: `ex-${rule.id}`,
      ruleId: e.ruleId,
      date: new Date(e.date),
    }));

    const days = expandRuleToDays(
      {
        id: rule.id,
        traineeId: rule.traineeId,
        scheduleType: rule.scheduleType,
        startDate: new Date(rule.startDate),
        endDate: new Date(rule.endDate),
        weekDays: rule.weekDays,
        interval: rule.interval,
        createdAt: new Date(rule.startDate),
      },
      rangeStart,
      rangeEnd,
      exceptions,
    );

    for (const day of days) {
      const dayStr = toLocalIsoDay(day);
      views.push({
        id: rule.id,
        traineeId: rule.traineeId,
        scheduleType: rule.scheduleType,
        startDate: dayStr,
        endDate: dayStr,
        department: rule.department ?? null,
        color: null,
        trainee: rule.trainee,
        supervisor: rule.supervisor ?? null,
        ruleId: rule.id,
        recurring: true,
      });
    }
  }

  return views;
}
