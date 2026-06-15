import type { ScheduleAssignmentView } from "@/components/schedule/types";
import { MS_PER_DAY, toMonday, toSunday } from "@/lib/date-utils";

const PADDING_DAYS = 14;

export function computeDataBounds(assignments: ScheduleAssignmentView[]) {
  if (assignments.length === 0) return null;

  let minDate = new Date(assignments[0].startDate);
  let maxDate = new Date(assignments[0].endDate);

  for (const a of assignments) {
    const s = new Date(a.startDate);
    const e = new Date(a.endDate);
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
  }

  const padMs = PADDING_DAYS * MS_PER_DAY;
  const start = new Date(minDate.getTime() - padMs);
  const end = new Date(maxDate.getTime() + padMs);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPad = new Date(today.getTime() + padMs);

  return {
    start: toMonday(start < today ? start : today),
    end: toSunday(end > todayPad ? end : todayPad),
    minBound: toMonday(new Date(minDate.getTime() - padMs * 2)),
    maxBound: toSunday(new Date(maxDate.getTime() + padMs * 2)),
  };
}
