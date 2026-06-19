import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWeekDates(year: number, week: number) {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatDayName(date: Date): string {
  return date.toLocaleDateString("de-DE", { weekday: "short" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getCurrentWeek(): { year: number; week: number } {
  return getIsoWeek(new Date());
}

export function getIsoWeek(date: Date): { year: number; week: number } {
  const d = new Date(date.getTime());
  d.setUTCHours(12, 0, 0, 0);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getIsoWeeksInYear(year: number): number {
  const dec28 = new Date(year, 11, 28);
  return getIsoWeek(dec28).week;
}

export function getTrainingStartWeek(trainingStartDate: Date | null | undefined): { year: number; week: number } | null {
  if (!trainingStartDate) return null;
  return getIsoWeek(trainingStartDate);
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  trainer: "Ausbilder",
  training_officer: "Ausbildungsbeauftragter",
  trainee: "Auszubildende(r)",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  submitted: "Eingereicht",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  needs_revision: "Überarbeitung erforderlich",
};

export const DAY_TYPE_LABELS: Record<string, string> = {
  company: "Betrieb",
  vocational_school: "Berufsschule",
  vacation: "Urlaub",
  other: "Sonstiges",
};

export const DAY_TYPES = ["company", "vocational_school", "vacation", "other"] as const;

export function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    draft: "default",
    submitted: "warning",
    approved: "success",
    rejected: "danger",
    needs_revision: "info",
  };
  return map[status] || "default";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-surface-overlay",
    submitted: "bg-warning-soft",
    approved: "bg-success-soft",
    rejected: "bg-danger-soft",
    needs_revision: "bg-info-soft",
    missing: "bg-danger-soft",
  };
  return map[status] || "bg-surface-overlay";
}

export function statusCellColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-surface-overlay",
    submitted: "bg-warning-soft",
    approved: "bg-success-soft",
    rejected: "bg-danger-soft",
    needs_revision: "bg-info-soft",
    missing: "bg-danger-soft",
  };
  return map[status] || "bg-surface-overlay";
}

export function statusDotColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-surface-overlay border border-stroke-subtle",
    submitted: "bg-warning",
    approved: "bg-success",
    rejected: "bg-danger",
    needs_revision: "bg-info",
    missing: "bg-danger",
  };
  return map[status] || "bg-surface-overlay border border-stroke-subtle";
}

export interface WeekInfo {
  year: number;
  week: number;
  startDate: Date;
  label: string;
}

export function getWeeksInMonth(year: number, month: number): WeekInfo[] {
  const lastDay = new Date(year, month + 1, 0);

  const weeks: WeekInfo[] = [];

  const d = new Date(year, month, 1);
  d.setHours(12, 0, 0, 0);

  do {
    const { year: wy, week } = getIsoWeek(d);
    const dates = getWeekDates(wy, week);
    const startStr = dates[0].toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    const endStr = dates[6].toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    weeks.push({ year: wy, week, startDate: dates[0], label: `${startStr} – ${endStr}` });
    d.setDate(d.getDate() + 7);
    if (d.getMonth() !== month && weeks.length > 0) break;
  } while (d <= lastDay);

  return weeks;
}

export function isBeforeTrainingStart(
  y: number,
  w: number,
  trainingStart: { year: number; week: number } | null,
): boolean {
  if (!trainingStart) {
    // Fallback: maximal 2 Jahre vor heute
    const now = getCurrentWeek();
    return y < now.year - 2 || (y === now.year - 2 && w < now.week);
  }
  return y < trainingStart.year || (y === trainingStart.year && w < trainingStart.week);
}
