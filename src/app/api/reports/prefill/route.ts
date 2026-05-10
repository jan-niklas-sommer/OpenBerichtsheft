import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { buildDefaultEntries } from "@/lib/report-builder";
import { type SingleAssignment, type RecurrenceRule, type RecurrenceException } from "@/lib/schedule-resolver";
import { getWeekDates } from "@/lib/utils";
import { z } from "zod";

const prefillParams = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  week: z.coerce.number().int().min(1).max(53),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "trainee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = prefillParams.safeParse({
    year: url.searchParams.get("year"),
    week: url.searchParams.get("week"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "year and week required", details: parsed.error.flatten() }, { status: 400 });
  }
  const { year, week } = parsed.data;

  const traineeId = session.user.id;
  const weekDates = getWeekDates(year, week);
  const start = weekDates[0];
  const end = weekDates[6];

  const [assignments, rules] = await Promise.all([
    prisma.scheduleAssignment.findMany({
      where: {
        traineeId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    }),
    prisma.recurrenceRule.findMany({
      where: {
        traineeId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { exceptions: true },
    }),
    Promise.resolve([] as { id: string; ruleId: string; date: Date; reason: string | null }[]),
  ]);

  const singleAssignments: SingleAssignment[] = assignments.map((a) => ({
    id: a.id,
    traineeId: a.traineeId,
    scheduleType: a.scheduleType as "department" | "school" | "vacation" | "other",
    startDate: a.startDate,
    endDate: a.endDate,
    department: a.department ?? undefined,
    supervisorId: a.supervisorId ?? undefined,
  }));

  const recurrenceRules: RecurrenceRule[] = rules.map((r) => ({
    id: r.id,
    traineeId: r.traineeId,
    scheduleType: r.scheduleType,
    startDate: r.startDate,
    endDate: r.endDate,
    weekDays: r.weekDays,
    displayLabel: r.displayLabel ?? undefined,
    department: r.department ?? undefined,
    supervisorId: r.supervisorId ?? undefined,
    createdAt: r.createdAt,
  }));

  const allExceptions: RecurrenceException[] = [];
  for (const rule of rules) {
    for (const ex of rule.exceptions) {
      allExceptions.push({
        id: ex.id,
        ruleId: ex.ruleId,
        date: ex.date,
        reason: ex.reason ?? undefined,
      });
    }
  }

  const entries = buildDefaultEntries(year, week, singleAssignments, recurrenceRules, allExceptions);

  return NextResponse.json(entries);
}
