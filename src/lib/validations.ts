import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});

export const createUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  name: z.string().min(1, "Name erforderlich"),
  role: z.enum(["admin", "trainer", "training_officer", "trainee"]),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  professionId: z.string().uuid().optional(),
  trainingStartDate: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  name: z.string().min(1, "Name erforderlich").optional(),
  role: z.enum(["admin", "trainer", "training_officer", "trainee"]).optional(),
  password: z.string().min(8, "Mindestens 8 Zeichen").optional(),
  deactivatedAt: z.date().nullable().optional(),
  professionId: z.string().uuid().nullable().optional(),
  trainingStartDate: z.string().nullable().optional(),
});

export const createProfessionSchema = z.object({
  name: z.string().min(1, "Name erforderlich").max(200),
});

export const updateProfessionSchema = z.object({
  name: z.string().min(1, "Name erforderlich").max(200),
});

export const dailyEntrySchema = z.object({
  date: z.string(),
  dayType: z.enum(["company", "vocational_school", "vacation", "other"]),
  hours: z.number().int().min(0).max(24),
  minutes: z.number().int().min(0).max(59),
  reportText: z.string().optional(),
});

export const weeklyReportSchema = z.object({
  calendarYear: z.number().int().min(2020).max(2100),
  calendarWeek: z.number().int().min(1).max(53),
  reportText: z.string().optional(),
  reportType: z.enum(["weekly", "daily"]).optional(),
  dailyEntries: z.array(dailyEntrySchema).min(7).max(7),
});

export const reviewSchema = z.object({
  action: z.enum(["approved", "needs_revision", "rejected"]),
  comment: z.string().optional(),
}).refine(
  (data) => data.action === "approved" || (data.comment && data.comment.trim().length > 0),
  { message: "Comment required for rejection or revision", path: ["comment"] }
);

export const assignmentSchema = z.object({
  trainerId: z.string().uuid(),
  professionId: z.string().uuid(),
});

export const updateReportSchema = z.object({
  reportText: z.string().optional(),
  reportType: z.enum(["weekly", "daily"]).optional(),
  dailyEntries: z.array(dailyEntrySchema).optional(),
});

export const officerAssignmentSchema = z.object({
  traineeId: z.string().uuid(),
  trainingOfficerId: z.string().uuid(),
  validFrom: z.string(),
  validUntil: z.string(),
}).refine(
  (data) => new Date(data.validUntil) > new Date(data.validFrom),
  { message: "validUntil must be after validFrom", path: ["validUntil"] }
);

export const scheduleTypeSchema = z.enum(["department", "school", "vacation", "other"]);

export const updateScheduleSchema = z.object({
  id: z.string().uuid(),
  scheduleType: scheduleTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
});

export const updateRecurrenceRuleSchema = z.object({
  id: z.string().uuid(),
  scheduleType: scheduleTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  weekDays: z.union([
    z.number().int().min(1).max(127),
    z.array(z.number().int().min(1).max(7)).min(1),
  ]).optional(),
  displayLabel: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
});

export const updateSettingsSchema = z.object({
  workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort erforderlich"),
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
  confirmPassword: z.string().min(1, "Passwortbestätigung erforderlich"),
}).refine(
  (data) => data.newPassword !== data.currentPassword,
  { message: "Neues Passwort muss sich vom aktuellen unterscheiden", path: ["newPassword"] }
).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwörter stimmen nicht überein", path: ["confirmPassword"] }
);
