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
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1);
  const diff = now.getTime() - monday.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return { year: now.getFullYear(), week };
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
