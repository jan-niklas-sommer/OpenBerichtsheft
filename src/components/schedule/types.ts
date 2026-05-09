export const TYPE_COLORS: Record<string, string> = {
  school: "#3b82f6",
  vacation: "#f59e0b",
  department: "#10b981",
  other: "#8b5cf6",
};

export const TYPE_LABELS: Record<string, string> = {
  department: "Abteilung",
  school: "Berufsschule",
  vacation: "Urlaub",
  other: "Sonstiges",
};

export const LAYER_ORDER = ["school", "vacation", "other", "department"];

export type ScheduleType = "department" | "school" | "vacation" | "other";

export interface ScheduleAssignmentView {
  id: string;
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate: string;
  department: string | null;
  color: string | null;
  trainee: { id: string; name: string; profession?: { name: string } | null };
  supervisor: { id: string; name: string } | null;
}

export interface RecurrenceRuleView {
  id: string;
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate: string;
  weekDays: number;
  displayLabel: string | null;
  department: string | null;
  color: string | null;
  priority: number;
  trainee: { id: string; name: string; profession?: { name: string } | null };
  supervisor: { id: string; name: string } | null;
}

export function getTopAssignmentForDay(
  traineeId: string,
  date: Date,
  assignments: ScheduleAssignmentView[],
): ScheduleAssignmentView | null {
  const items = assignments.filter(
    (a) =>
      a.traineeId === traineeId &&
      new Date(a.startDate) <= date &&
      new Date(a.endDate) >= date,
  );
  return (
    items.sort(
      (a, b) =>
        LAYER_ORDER.indexOf(a.scheduleType) -
        LAYER_ORDER.indexOf(b.scheduleType),
    )[0] || null
  );
}

export function getConflictsForDay(
  traineeId: string,
  date: Date,
  assignments: ScheduleAssignmentView[],
): ScheduleAssignmentView[] {
  return assignments.filter(
    (a) =>
      a.traineeId === traineeId &&
      new Date(a.startDate) <= date &&
      new Date(a.endDate) >= date,
  );
}

export function generateDays(start: Date, end: Date): Date[] {
  const result: Date[] = [];
  const d = new Date(start);
  while (d < end) {
    result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}
