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
});

export const updateUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  name: z.string().min(1, "Name erforderlich").optional(),
  role: z.enum(["admin", "trainer", "training_officer", "trainee"]).optional(),
  password: z.string().min(8, "Mindestens 8 Zeichen").optional(),
  deactivatedAt: z.date().nullable().optional(),
  professionId: z.string().uuid().nullable().optional(),
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
});

export const weeklyReportSchema = z.object({
  calendarYear: z.number().int().min(2020).max(2100),
  calendarWeek: z.number().int().min(1).max(53),
  reportText: z.string().optional(),
  dailyEntries: z.array(dailyEntrySchema),
});

export const reviewSchema = z.object({
  action: z.enum(["approved", "needs_revision", "rejected"]),
  comment: z.string().optional(),
});

export const assignmentSchema = z.object({
  traineeId: z.string().uuid(),
  trainerId: z.string().uuid(),
});

export const updateReportSchema = z.object({
  reportText: z.string().optional(),
  dailyEntries: z.array(z.object({
    date: z.string(),
    dayType: z.enum(["company", "vocational_school", "vacation", "other"]),
    hours: z.number().int().min(0).max(24),
    minutes: z.number().int().min(0).max(59),
  })).optional(),
});

export const officerAssignmentSchema = z.object({
  traineeId: z.string().uuid(),
  trainingOfficerId: z.string().uuid(),
});
