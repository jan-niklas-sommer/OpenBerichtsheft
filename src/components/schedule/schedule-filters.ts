import type { ScheduleAssignmentView } from "./types";

/**
 * Erkennt, ob es innerhalb der Zuweisungen eines Auszubildenden zeitliche
 * Überlappungen gibt (zwei Assignments am selben Tag). Gibt true zurück, sobald
 * mindestens ein Konflikt existiert — genutzt, um die Konflikt-Anzeige im Gantt
 * ein-/auszublenden.
 */
export function hasScheduleConflicts(assignments: ScheduleAssignmentView[]): boolean {
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a = assignments[i];
      const b = assignments[j];
      if (
        new Date(a.startDate) <= new Date(b.endDate) &&
        new Date(b.startDate) <= new Date(a.endDate)
      ) {
        return true;
      }
    }
  }
  return false;
}
