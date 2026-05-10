import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  dailyEntrySchema,
  weeklyReportSchema,
  reviewSchema,
  assignmentSchema,
  updateReportSchema,
  officerAssignmentSchema,
  createProfessionSchema,
  updateProfessionSchema,
  updateScheduleSchema,
  updateRecurrenceRuleSchema,
  changePasswordSchema,
} from "./validations";

describe("loginSchema", () => {
  const valid = { email: "user@example.com", password: "secret" };

  it("accepts valid input", () => {
    expect(loginSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing email", () => {
    expect(() => loginSchema.parse({ password: "secret" })).toThrow();
  });

  it("rejects missing password", () => {
    expect(() => loginSchema.parse({ email: "user@example.com" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      loginSchema.parse({ email: "not-an-email", password: "secret" })
    ).toThrow();
  });

  it("rejects empty password", () => {
    expect(() =>
      loginSchema.parse({ email: "user@example.com", password: "" })
    ).toThrow();
  });

  it("rejects non-string email", () => {
    expect(() =>
      loginSchema.parse({ email: 123, password: "secret" })
    ).toThrow();
  });

  it("rejects non-string password", () => {
    expect(() =>
      loginSchema.parse({ email: "user@example.com", password: 123 })
    ).toThrow();
  });
});

describe("createUserSchema", () => {
  const valid = {
    email: "user@example.com",
    name: "John",
    role: "trainee" as const,
    password: "12345678",
  };

  it("accepts valid input", () => {
    expect(createUserSchema.parse(valid)).toEqual(valid);
  });

  it("accepts valid input with optional professionId", () => {
    const input = { ...valid, professionId: "550e8400-e29b-41d4-a716-446655440000" };
    expect(createUserSchema.parse(input)).toEqual(input);
  });

  it("accepts input without optional professionId", () => {
    expect(createUserSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing email", () => {
    expect(() =>
      createUserSchema.parse({ name: "John", role: "trainee", password: "12345678" })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      createUserSchema.parse({ ...valid, email: "bad" })
    ).toThrow();
  });

  it("rejects missing name", () => {
    expect(() =>
      createUserSchema.parse({ email: "user@example.com", role: "trainee", password: "12345678" })
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      createUserSchema.parse({ ...valid, name: "" })
    ).toThrow();
  });

  it("rejects missing role", () => {
    expect(() =>
      createUserSchema.parse({ email: "user@example.com", name: "John", password: "12345678" })
    ).toThrow();
  });

  it("rejects invalid role", () => {
    expect(() =>
      createUserSchema.parse({ ...valid, role: "superadmin" })
    ).toThrow();
  });

  it("accepts all valid roles", () => {
    for (const role of ["admin", "trainer", "training_officer", "trainee"] as const) {
      expect(createUserSchema.parse({ ...valid, role })).toBeDefined();
    }
  });

  it("rejects missing password", () => {
    expect(() =>
      createUserSchema.parse({ email: "user@example.com", name: "John", role: "trainee" })
    ).toThrow();
  });

  it("rejects short password (7 chars)", () => {
    expect(() =>
      createUserSchema.parse({ ...valid, password: "1234567" })
    ).toThrow();
  });

  it("accepts password with exactly 8 chars", () => {
    expect(createUserSchema.parse({ ...valid, password: "12345678" })).toBeDefined();
  });

  it("rejects non-UUID professionId", () => {
    expect(() =>
      createUserSchema.parse({ ...valid, professionId: "not-a-uuid" })
    ).toThrow();
  });
});

describe("updateUserSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(updateUserSchema.parse({})).toEqual({});
  });

  it("accepts valid email", () => {
    expect(updateUserSchema.parse({ email: "a@b.com" })).toEqual({ email: "a@b.com" });
  });

  it("rejects invalid email", () => {
    expect(() => updateUserSchema.parse({ email: "bad" })).toThrow();
  });

  it("accepts valid name", () => {
    expect(updateUserSchema.parse({ name: "John" })).toEqual({ name: "John" });
  });

  it("rejects empty name", () => {
    expect(() => updateUserSchema.parse({ name: "" })).toThrow();
  });

  it("accepts valid role", () => {
    expect(updateUserSchema.parse({ role: "admin" })).toEqual({ role: "admin" });
  });

  it("rejects invalid role", () => {
    expect(() => updateUserSchema.parse({ role: "hacker" })).toThrow();
  });

  it("accepts valid password", () => {
    expect(updateUserSchema.parse({ password: "12345678" })).toEqual({ password: "12345678" });
  });

  it("rejects short password", () => {
    expect(() => updateUserSchema.parse({ password: "short" })).toThrow();
  });

  it("accepts deactivatedAt as date", () => {
    const d = new Date();
    const result = updateUserSchema.parse({ deactivatedAt: d });
    expect(result.deactivatedAt).toEqual(d);
  });

  it("accepts deactivatedAt as null", () => {
    expect(updateUserSchema.parse({ deactivatedAt: null })).toEqual({ deactivatedAt: null });
  });

  it("accepts professionId as UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(updateUserSchema.parse({ professionId: uuid })).toEqual({ professionId: uuid });
  });

  it("accepts professionId as null", () => {
    expect(updateUserSchema.parse({ professionId: null })).toEqual({ professionId: null });
  });

  it("rejects non-UUID professionId", () => {
    expect(() => updateUserSchema.parse({ professionId: "nope" })).toThrow();
  });

  it("accepts all fields at once", () => {
    const d = new Date();
    const input = {
      email: "a@b.com",
      name: "X",
      role: "trainer" as const,
      password: "12345678",
      deactivatedAt: d,
      professionId: "550e8400-e29b-41d4-a716-446655440000",
    };
    const result = updateUserSchema.parse(input);
    expect(result.email).toBe("a@b.com");
    expect(result.name).toBe("X");
    expect(result.role).toBe("trainer");
    expect(result.password).toBe("12345678");
    expect(result.deactivatedAt).toEqual(d);
    expect(result.professionId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("createProfessionSchema", () => {
  it("accepts valid name", () => {
    expect(createProfessionSchema.parse({ name: "Fachinformatiker" })).toEqual({ name: "Fachinformatiker" });
  });

  it("rejects empty name", () => {
    expect(() => createProfessionSchema.parse({ name: "" })).toThrow();
  });

  it("rejects missing name", () => {
    expect(() => createProfessionSchema.parse({})).toThrow();
  });

  it("accepts name at max length (200)", () => {
    expect(createProfessionSchema.parse({ name: "a".repeat(200) })).toBeDefined();
  });

  it("rejects name exceeding max length (201)", () => {
    expect(() => createProfessionSchema.parse({ name: "a".repeat(201) })).toThrow();
  });
});

describe("updateProfessionSchema", () => {
  it("accepts valid name", () => {
    expect(updateProfessionSchema.parse({ name: "Fachinformatiker" })).toEqual({ name: "Fachinformatiker" });
  });

  it("rejects empty name", () => {
    expect(() => updateProfessionSchema.parse({ name: "" })).toThrow();
  });

  it("rejects missing name", () => {
    expect(() => updateProfessionSchema.parse({})).toThrow();
  });

  it("accepts name at max length (200)", () => {
    expect(updateProfessionSchema.parse({ name: "a".repeat(200) })).toBeDefined();
  });

  it("rejects name exceeding max length (201)", () => {
    expect(() => updateProfessionSchema.parse({ name: "a".repeat(201) })).toThrow();
  });
});

describe("dailyEntrySchema", () => {
  const valid = {
    date: "2025-01-06",
    dayType: "company" as const,
    hours: 8,
    minutes: 0,
  };

  it("accepts valid input", () => {
    expect(dailyEntrySchema.parse(valid)).toEqual(valid);
  });

  it("accepts all valid dayTypes", () => {
    for (const dayType of ["company", "vocational_school", "vacation", "other"] as const) {
      expect(dailyEntrySchema.parse({ ...valid, dayType })).toBeDefined();
    }
  });

  it("rejects invalid dayType", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, dayType: "sick" })).toThrow();
  });

  it("rejects missing date", () => {
    expect(() =>
      dailyEntrySchema.parse({ dayType: "company", hours: 8, minutes: 0 })
    ).toThrow();
  });

  it("rejects missing dayType", () => {
    expect(() =>
      dailyEntrySchema.parse({ date: "2025-01-06", hours: 8, minutes: 0 })
    ).toThrow();
  });

  it("rejects missing hours", () => {
    expect(() =>
      dailyEntrySchema.parse({ date: "2025-01-06", dayType: "company", minutes: 0 })
    ).toThrow();
  });

  it("rejects missing minutes", () => {
    expect(() =>
      dailyEntrySchema.parse({ date: "2025-01-06", dayType: "company", hours: 8 })
    ).toThrow();
  });

  it("accepts hours = 0", () => {
    expect(dailyEntrySchema.parse({ ...valid, hours: 0 })).toBeDefined();
  });

  it("accepts hours = 24", () => {
    expect(dailyEntrySchema.parse({ ...valid, hours: 24 })).toBeDefined();
  });

  it("rejects hours > 24", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, hours: 25 })).toThrow();
  });

  it("rejects hours < 0", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, hours: -1 })).toThrow();
  });

  it("rejects non-integer hours", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, hours: 8.5 })).toThrow();
  });

  it("accepts minutes = 0", () => {
    expect(dailyEntrySchema.parse({ ...valid, minutes: 0 })).toBeDefined();
  });

  it("accepts minutes = 59", () => {
    expect(dailyEntrySchema.parse({ ...valid, minutes: 59 })).toBeDefined();
  });

  it("rejects minutes > 59", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, minutes: 60 })).toThrow();
  });

  it("rejects minutes < 0", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, minutes: -1 })).toThrow();
  });

  it("rejects non-integer minutes", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, minutes: 30.5 })).toThrow();
  });

  it("rejects non-number hours", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, hours: "8" })).toThrow();
  });

  it("rejects non-number minutes", () => {
    expect(() => dailyEntrySchema.parse({ ...valid, minutes: "30" })).toThrow();
  });
});

describe("weeklyReportSchema", () => {
  const validEntry = {
    date: "2025-01-06",
    dayType: "company" as const,
    hours: 8,
    minutes: 0,
  };
  const validEntries = Array.from({ length: 7 }, (_, i) => ({
    ...validEntry,
    date: `2025-01-${String(6 + i).padStart(2, "0")}`,
  }));
  const valid = {
    calendarYear: 2025,
    calendarWeek: 3,
    dailyEntries: validEntries,
  };

  it("accepts valid input", () => {
    expect(weeklyReportSchema.parse(valid)).toEqual({ ...valid, reportText: undefined });
  });

  it("accepts valid input with reportText", () => {
    const input = { ...valid, reportText: "This week I learned..." };
    expect(weeklyReportSchema.parse(input).reportText).toBe("This week I learned...");
  });

  it("accepts input without optional reportText", () => {
    expect(weeklyReportSchema.parse(valid)).toBeDefined();
  });

  it("accepts calendarYear = 2020 (min)", () => {
    expect(weeklyReportSchema.parse({ ...valid, calendarYear: 2020 })).toBeDefined();
  });

  it("accepts calendarYear = 2100 (max)", () => {
    expect(weeklyReportSchema.parse({ ...valid, calendarYear: 2100 })).toBeDefined();
  });

  it("rejects calendarYear < 2020", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarYear: 2019 })).toThrow();
  });

  it("rejects calendarYear > 2100", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarYear: 2101 })).toThrow();
  });

  it("accepts calendarWeek = 1 (min)", () => {
    expect(weeklyReportSchema.parse({ ...valid, calendarWeek: 1 })).toBeDefined();
  });

  it("accepts calendarWeek = 53 (max)", () => {
    expect(weeklyReportSchema.parse({ ...valid, calendarWeek: 53 })).toBeDefined();
  });

  it("rejects calendarWeek < 1", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarWeek: 0 })).toThrow();
  });

  it("rejects calendarWeek > 53", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarWeek: 54 })).toThrow();
  });

  it("rejects non-integer calendarYear", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarYear: 2025.5 })).toThrow();
  });

  it("rejects non-integer calendarWeek", () => {
    expect(() => weeklyReportSchema.parse({ ...valid, calendarWeek: 3.5 })).toThrow();
  });

  it("rejects missing calendarYear", () => {
    expect(() =>
      weeklyReportSchema.parse({ calendarWeek: 3, dailyEntries: [validEntry] })
    ).toThrow();
  });

  it("rejects missing calendarWeek", () => {
    expect(() =>
      weeklyReportSchema.parse({ calendarYear: 2025, dailyEntries: [validEntry] })
    ).toThrow();
  });

  it("rejects missing dailyEntries", () => {
    expect(() =>
      weeklyReportSchema.parse({ calendarYear: 2025, calendarWeek: 3 })
    ).toThrow();
  });

  it("rejects dailyEntries with fewer than 7 entries", () => {
    expect(() =>
      weeklyReportSchema.parse({ ...valid, dailyEntries: [validEntry] })
    ).toThrow();
  });

  it("rejects empty dailyEntries array", () => {
    expect(() =>
      weeklyReportSchema.parse({ ...valid, dailyEntries: [] })
    ).toThrow();
  });

  it("rejects invalid dailyEntry in array", () => {
    expect(() =>
      weeklyReportSchema.parse({
        ...valid,
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 99, minutes: 0 }],
      })
    ).toThrow();
  });
});

describe("reviewSchema", () => {
  it("accepts approved action", () => {
    expect(reviewSchema.parse({ action: "approved" })).toEqual({ action: "approved", comment: undefined });
  });

  it("rejects needs_revision action without comment", () => {
    expect(() => reviewSchema.parse({ action: "needs_revision" })).toThrow();
  });

  it("accepts needs_revision action with comment", () => {
    expect(reviewSchema.parse({ action: "needs_revision", comment: "Bitte überarbeiten" })).toEqual({
      action: "needs_revision",
      comment: "Bitte überarbeiten",
    });
  });

  it("rejects rejected action without comment", () => {
    expect(() => reviewSchema.parse({ action: "rejected" })).toThrow();
  });

  it("accepts rejected action with comment", () => {
    expect(reviewSchema.parse({ action: "rejected", comment: "Nicht ausreichend" })).toEqual({
      action: "rejected",
      comment: "Nicht ausreichend",
    });
  });

  it("accepts action with comment", () => {
    expect(reviewSchema.parse({ action: "approved", comment: "Looks good" })).toEqual({
      action: "approved",
      comment: "Looks good",
    });
  });

  it("rejects invalid action", () => {
    expect(() => reviewSchema.parse({ action: "pending" })).toThrow();
  });

  it("rejects missing action", () => {
    expect(() => reviewSchema.parse({ comment: "hello" })).toThrow();
  });
});

describe("assignmentSchema", () => {
  const valid = {
    trainerId: "660e8400-e29b-41d4-a716-446655440001",
    professionId: "770e8400-e29b-41d4-a716-446655440002",
  };

  it("accepts valid input", () => {
    expect(assignmentSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing trainerId", () => {
    expect(() =>
      assignmentSchema.parse({ professionId: "770e8400-e29b-41d4-a716-446655440002" })
    ).toThrow();
  });

  it("rejects missing professionId", () => {
    expect(() =>
      assignmentSchema.parse({ trainerId: "660e8400-e29b-41d4-a716-446655440001" })
    ).toThrow();
  });

  it("rejects non-UUID trainerId", () => {
    expect(() =>
      assignmentSchema.parse({ ...valid, trainerId: "not-a-uuid" })
    ).toThrow();
  });

  it("rejects non-UUID professionId", () => {
    expect(() =>
      assignmentSchema.parse({ ...valid, professionId: "not-a-uuid" })
    ).toThrow();
  });
});

describe("updateReportSchema", () => {
  const validEntry = {
    date: "2025-01-06",
    dayType: "company" as const,
    hours: 8,
    minutes: 0,
  };

  it("accepts empty object (all optional)", () => {
    expect(updateReportSchema.parse({})).toEqual({});
  });

  it("accepts reportText only", () => {
    expect(updateReportSchema.parse({ reportText: "Updated text" })).toEqual({ reportText: "Updated text" });
  });

  it("accepts dailyEntries only", () => {
    const input = { dailyEntries: [validEntry] };
    expect(updateReportSchema.parse(input)).toEqual(input);
  });

  it("accepts both reportText and dailyEntries", () => {
    const input = { reportText: "Updated", dailyEntries: [validEntry] };
    expect(updateReportSchema.parse(input)).toEqual(input);
  });

  it("rejects invalid dayType in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "invalid", hours: 8, minutes: 0 }],
      })
    ).toThrow();
  });

  it("rejects hours > 24 in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 25, minutes: 0 }],
      })
    ).toThrow();
  });

  it("rejects hours < 0 in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: -1, minutes: 0 }],
      })
    ).toThrow();
  });

  it("rejects minutes > 59 in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 8, minutes: 60 }],
      })
    ).toThrow();
  });

  it("rejects minutes < 0 in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 8, minutes: -1 }],
      })
    ).toThrow();
  });

  it("rejects non-integer hours in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 8.5, minutes: 0 }],
      })
    ).toThrow();
  });

  it("rejects non-integer minutes in dailyEntries", () => {
    expect(() =>
      updateReportSchema.parse({
        dailyEntries: [{ date: "2025-01-06", dayType: "company", hours: 8, minutes: 0.5 }],
      })
    ).toThrow();
  });

  it("accepts empty dailyEntries array", () => {
    expect(updateReportSchema.parse({ dailyEntries: [] })).toEqual({ dailyEntries: [] });
  });
});

describe("officerAssignmentSchema", () => {
  const valid = {
    traineeId: "550e8400-e29b-41d4-a716-446655440000",
    trainingOfficerId: "770e8400-e29b-41d4-a716-446655440002",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
  };

  it("accepts valid input", () => {
    expect(officerAssignmentSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing traineeId", () => {
    expect(() =>
      officerAssignmentSchema.parse({ trainingOfficerId: "770e8400-e29b-41d4-a716-446655440002", validFrom: "2026-01-01", validUntil: "2026-12-31" })
    ).toThrow();
  });

  it("rejects missing trainingOfficerId", () => {
    expect(() =>
      officerAssignmentSchema.parse({ traineeId: "550e8400-e29b-41d4-a716-446655440000", validFrom: "2026-01-01", validUntil: "2026-12-31" })
    ).toThrow();
  });

  it("rejects non-UUID traineeId", () => {
    expect(() =>
      officerAssignmentSchema.parse({ ...valid, traineeId: "bad" })
    ).toThrow();
  });

  it("rejects non-UUID trainingOfficerId", () => {
    expect(() =>
      officerAssignmentSchema.parse({ ...valid, trainingOfficerId: "bad" })
    ).toThrow();
  });

  it("rejects validUntil before validFrom", () => {
    expect(() =>
      officerAssignmentSchema.parse({ ...valid, validFrom: "2026-12-31", validUntil: "2026-01-01" })
    ).toThrow();
  });

  it("rejects equal validFrom and validUntil", () => {
    expect(() =>
      officerAssignmentSchema.parse({ ...valid, validFrom: "2026-06-01", validUntil: "2026-06-01" })
    ).toThrow();
  });
});

describe("updateScheduleSchema", () => {
  it("accepts valid input with all fields", () => {
    const input = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      scheduleType: "department",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      department: "IT",
      supervisorId: "660e8400-e29b-41d4-a716-446655440001",
    };
    expect(updateScheduleSchema.parse(input)).toEqual(input);
  });

  it("accepts id only", () => {
    const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
    expect(updateScheduleSchema.parse(input)).toEqual(input);
  });

  it("rejects missing id", () => {
    expect(() => updateScheduleSchema.parse({ department: "IT" })).toThrow();
  });

  it("rejects non-UUID id", () => {
    expect(() => updateScheduleSchema.parse({ id: "bad" })).toThrow();
  });

  it("rejects invalid scheduleType", () => {
    expect(() =>
      updateScheduleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", scheduleType: "invalid" })
    ).toThrow();
  });

  it("accepts null department", () => {
    expect(
      updateScheduleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", department: null })
    ).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", department: null });
  });

  it("accepts null supervisorId", () => {
    expect(
      updateScheduleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", supervisorId: null })
    ).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", supervisorId: null });
  });

  it("rejects non-UUID supervisorId", () => {
    expect(() =>
      updateScheduleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", supervisorId: "bad" })
    ).toThrow();
  });
});

describe("updateRecurrenceRuleSchema", () => {
  it("accepts valid input with all fields", () => {
    const input = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      scheduleType: "school",
      startDate: "2026-01-05",
      endDate: "2026-06-30",
      weekDays: [1, 2, 3, 4, 5],
      displayLabel: "Berufsschule",
      department: "Schule",
      supervisorId: "660e8400-e29b-41d4-a716-446655440001",
    };
    expect(updateRecurrenceRuleSchema.parse(input)).toEqual(input);
  });

  it("accepts id only", () => {
    const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
    expect(updateRecurrenceRuleSchema.parse(input)).toEqual(input);
  });

  it("accepts weekDays as bitfield number", () => {
    expect(
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", weekDays: 31 })
    ).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", weekDays: 31 });
  });

  it("rejects missing id", () => {
    expect(() => updateRecurrenceRuleSchema.parse({ scheduleType: "school" })).toThrow();
  });

  it("rejects non-UUID id", () => {
    expect(() => updateRecurrenceRuleSchema.parse({ id: "bad" })).toThrow();
  });

  it("rejects invalid scheduleType", () => {
    expect(() =>
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", scheduleType: "invalid" })
    ).toThrow();
  });

  it("rejects empty weekDays array", () => {
    expect(() =>
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", weekDays: [] })
    ).toThrow();
  });

  it("accepts valid interval", () => {
    expect(
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 2 })
    ).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 2 });
  });

  it("rejects interval < 1", () => {
    expect(() =>
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 0 })
    ).toThrow();
  });

  it("rejects interval > 12", () => {
    expect(() =>
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 13 })
    ).toThrow();
  });

  it("accepts interval = 1", () => {
    expect(
      updateRecurrenceRuleSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 1 })
    ).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", interval: 1 });
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "oldpassword123",
    newPassword: "newpassword456",
    confirmPassword: "newpassword456",
  };

  it("accepts valid input", () => {
    expect(changePasswordSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing currentPassword", () => {
    expect(() =>
      changePasswordSchema.parse({ newPassword: "newpassword456", confirmPassword: "newpassword456" })
    ).toThrow();
  });

  it("rejects empty currentPassword", () => {
    expect(() =>
      changePasswordSchema.parse({ ...valid, currentPassword: "" })
    ).toThrow();
  });

  it("rejects missing newPassword", () => {
    expect(() =>
      changePasswordSchema.parse({ currentPassword: "oldpassword123", confirmPassword: "newpassword456" })
    ).toThrow();
  });

  it("rejects newPassword shorter than 8 chars", () => {
    expect(() =>
      changePasswordSchema.parse({ ...valid, newPassword: "short7", confirmPassword: "short7" })
    ).toThrow();
  });

  it("accepts newPassword with exactly 8 chars", () => {
    expect(changePasswordSchema.parse({ ...valid, newPassword: "12345678", confirmPassword: "12345678" })).toBeDefined();
  });

  it("rejects missing confirmPassword", () => {
    expect(() =>
      changePasswordSchema.parse({ currentPassword: "oldpassword123", newPassword: "newpassword456" })
    ).toThrow();
  });

  it("rejects when newPassword !== confirmPassword", () => {
    expect(() =>
      changePasswordSchema.parse({ ...valid, confirmPassword: "different789" })
    ).toThrow();
  });

  it("rejects when newPassword equals currentPassword", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "samepassword",
        newPassword: "samepassword",
        confirmPassword: "samepassword",
      })
    ).toThrow();
  });
});
