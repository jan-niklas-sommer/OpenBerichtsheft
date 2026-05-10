import type { ScheduleAssignmentView } from "@/components/schedule/types";

const PADDING_DAYS = 14;

function toMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

function toSunday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

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

  const padMs = PADDING_DAYS * 86400000;
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

export function clampViewToBounds(
  nextStart: Date,
  nextEnd: Date,
  minBound: Date | null,
  maxBound: Date | null,
): { start: Date; end: Date } {
  let start = nextStart;
  let end = nextEnd;
  if (minBound && start < minBound) start = new Date(minBound);
  if (maxBound && end > maxBound) end = new Date(maxBound);
  return { start, end };
}
