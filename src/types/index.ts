export type Role = "admin" | "trainer" | "training_officer" | "trainee";

export type ReportStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_revision";

export type DayType = "company" | "vocational_school" | "vacation" | "other";

export type ReportType = "weekly" | "daily";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  trainingStartDate: string | null;
}

export interface DailyEntryData {
  id?: string;
  date: string;
  dayType: DayType;
  hours: number;
  minutes: number;
  reportText?: string;
}

export interface WeeklyReportData {
  id: string;
  traineeId: string;
  weekStartDate: string;
  weekEndDate: string;
  calendarYear: number;
  calendarWeek: number;
  reportText: string | null;
  reportType: ReportType;
  status: ReportStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  trainee?: { id: string; name: string; email: string; profession?: { id: string; name: string } | null };
  dailyEntries: DailyEntryData[];
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: Role;
  professionId: string | null;
  trainingStartDate: string | null;
  createdAt: string;
  deactivatedAt: string | null;
}

export interface ProfessionData {
  id: string;
  name: string;
  createdAt: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AssignmentData {
  id: string;
  trainerId: string;
  professionId: string;
  trainer?: { id: string; name: string; email: string };
  profession?: { id: string; name: string };
}

export interface AppSettingsData {
  workingDays: number[];
}
