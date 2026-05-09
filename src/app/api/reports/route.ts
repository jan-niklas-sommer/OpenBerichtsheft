import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weeklyReportSchema } from "@/lib/validations";
import { getWeekDates, getIsoWeek } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const year = url.searchParams.get("year");

  if (role === "trainee") {
    const where: Record<string, unknown> = { traineeId: userId };
    if (status) where.status = status;
    if (year) where.calendarYear = parseInt(year);

    const reports = await prisma.weeklyReport.findMany({
      where,
      include: {
        dailyEntries: { orderBy: { date: "asc" } },
        trainee: { select: { id: true, name: true, profession: { select: { id: true, name: true } } } },
      },
      orderBy: { weekStartDate: "desc" },
    });
    return NextResponse.json(reports);
  }

  if (role === "trainer" || role === "training_officer" || role === "admin") {
    let traineeIds: string[] = [];

    if (role === "trainer") {
      const professionAssignments = await prisma.trainerProfessionAssignment.findMany({
        where: { trainerId: userId },
        select: { professionId: true },
      });
      const professionIds = professionAssignments.map((a) => a.professionId);
      if (professionIds.length > 0) {
        const trainees = await prisma.user.findMany({
          where: { role: "trainee", professionId: { in: professionIds } },
          select: { id: true },
        });
        traineeIds = trainees.map((t) => t.id);
      }
    } else if (role === "training_officer") {
      const assignments = await prisma.traineeOfficerAssignment.findMany({
        where: { trainingOfficerId: userId },
      });
      traineeIds = assignments.map((a) => a.traineeId);
    }

    const where: Record<string, unknown> = {};
    if (role !== "admin") {
      where.traineeId = { in: traineeIds };
    }
    if (status) where.status = status;
    if (year) where.calendarYear = parseInt(year);

    const reports = await prisma.weeklyReport.findMany({
      where,
      include: {
        dailyEntries: { orderBy: { date: "asc" } },
        trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
      },
      orderBy: { weekStartDate: "desc" },
    });
    return NextResponse.json(reports);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "trainee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = weeklyReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { calendarYear, calendarWeek, reportText, reportType, dailyEntries } = parsed.data;
  const traineeId = session.user.id;

  const trainee = await prisma.user.findUnique({
    where: { id: traineeId },
    select: { trainingStartDate: true },
  });

  if (trainee?.trainingStartDate) {
    const startWeek = getIsoWeek(trainee.trainingStartDate);
    if (
      calendarYear < startWeek.year ||
      (calendarYear === startWeek.year && calendarWeek < startWeek.week)
    ) {
      return NextResponse.json({ error: "Berichte vor dem Eintrittsdatum sind nicht erlaubt" }, { status: 400 });
    }
  }

  const weekDates = getWeekDates(calendarYear, calendarWeek);

  const report = await prisma.weeklyReport.upsert({
    where: {
      traineeId_calendarYear_calendarWeek: {
        traineeId,
        calendarYear,
        calendarWeek,
      },
    },
    create: {
      traineeId,
      weekStartDate: weekDates[0],
      weekEndDate: weekDates[6],
      calendarYear,
      calendarWeek,
      reportText: reportText || null,
      reportType: reportType || "weekly",
      status: "draft",
      dailyEntries: {
        create: dailyEntries.map((entry) => ({
          date: new Date(entry.date),
          dayType: entry.dayType,
          hours: entry.hours,
          minutes: entry.minutes,
          reportText: entry.reportText || null,
        })),
      },
    },
    update: {
      reportText: reportText || null,
      ...(reportType && { reportType }),
      dailyEntries: {
        deleteMany: {},
        create: dailyEntries.map((entry) => ({
          date: new Date(entry.date),
          dayType: entry.dayType,
          hours: entry.hours,
          minutes: entry.minutes,
          reportText: entry.reportText || null,
        })),
      },
    },
    include: { dailyEntries: { orderBy: { date: "asc" } } },
  });

  return NextResponse.json(report);
}
