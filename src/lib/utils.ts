import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
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
  d.setHours(12, 0, 0, 0);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
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
    draft: "bg-neutral-200 dark:bg-neutral-700",
    submitted: "bg-amber-400 dark:bg-amber-500",
    approved: "bg-emerald-500 dark:bg-emerald-400",
    rejected: "bg-red-500 dark:bg-red-400",
    needs_revision: "bg-blue-400 dark:bg-blue-500",
    missing: "bg-red-100 dark:bg-red-900/30",
  };
  return map[status] || "bg-neutral-100 dark:bg-neutral-800";
}

export function statusCellColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-neutral-200 dark:bg-neutral-700",
    submitted: "bg-amber-300 dark:bg-amber-600",
    approved: "bg-emerald-400 dark:bg-emerald-600",
    rejected: "bg-red-400 dark:bg-red-600",
    needs_revision: "bg-blue-300 dark:bg-blue-600",
    missing: "bg-red-100 dark:bg-red-900/30",
  };
  return map[status] || "bg-neutral-100 dark:bg-neutral-800";
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
