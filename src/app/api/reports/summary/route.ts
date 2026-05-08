import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIsoWeek } from "@/lib/utils";
import { NextResponse } from "next/server";

interface TraineeProgress {
  traineeId: string;
  traineeName: string;
  profession: string | null;
  totalReports: number;
  approved: number;
  submitted: number;
  draft: number;
  rejected: number;
  needsRevision: number;
  completionPercent: number;
  missingWeeks: { year: number; week: number }[];
}

function weekKey(y: number, w: number) {
  return `${y}-${w}`;
}

function weeksBetween(start: { year: number; week: number }, end: { year: number; week: number }) {
  const weeks: { year: number; week: number }[] = [];
  let y = start.year, w = start.week;
  while (y < end.year || (y === end.year && w <= end.week)) {
    weeks.push({ year: y, week: w });
    w++;
    if (w > 52) { w = 1; y++; }
  }
  return weeks;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  if (role !== "admin" && role !== "trainer" && role !== "training_officer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let traineeIds: string[] = [];

  if (role === "trainer") {
    const assignments = await prisma.traineeTrainerAssignment.findMany({
      where: { trainerId: userId },
    });
    traineeIds = assignments.map((a) => a.traineeId);
  } else if (role === "training_officer") {
    const assignments = await prisma.traineeOfficerAssignment.findMany({
      where: { trainingOfficerId: userId },
    });
    traineeIds = assignments.map((a) => a.traineeId);
  }

  const trainees = await prisma.user.findMany({
    where: {
      role: "trainee",
      deactivatedAt: null,
      ...(role !== "admin" && { id: { in: traineeIds } }),
    },
    select: {
      id: true,
      name: true,
      trainingStartDate: true,
      profession: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const reports = await prisma.weeklyReport.findMany({
    where: {
      traineeId: { in: trainees.map((t) => t.id) },
    },
    select: {
      traineeId: true,
      calendarYear: true,
      calendarWeek: true,
      status: true,
    },
  });

  const { year: currentYear, week: currentWeek } = getIsoWeek(new Date());

  const result: TraineeProgress[] = trainees.map((trainee) => {
    const traineeReports = reports.filter((r) => r.traineeId === trainee.id);

    const statusCounts = {
      approved: traineeReports.filter((r) => r.status === "approved").length,
      submitted: traineeReports.filter((r) => r.status === "submitted").length,
      draft: traineeReports.filter((r) => r.status === "draft").length,
      rejected: traineeReports.filter((r) => r.status === "rejected").length,
      needsRevision: traineeReports.filter((r) => r.status === "needs_revision").length,
    };

    const totalReports = traineeReports.length;

    const existingWeeks = new Set(
      traineeReports.map((r) => weekKey(r.calendarYear, r.calendarWeek))
    );

    const startWeek = trainee.trainingStartDate
      ? getIsoWeek(trainee.trainingStartDate)
      : { year: currentYear, week: Math.max(1, currentWeek - 12) };

    const allRelevantWeeks = weeksBetween(startWeek, { year: currentYear, week: currentWeek });
    const missingWeeks = allRelevantWeeks.filter((w) => !existingWeeks.has(weekKey(w.year, w.week)));

    const totalRelevant = allRelevantWeeks.length;
    const completionPercent = totalRelevant > 0
      ? Math.min(100, Math.round((statusCounts.approved / totalRelevant) * 100))
      : 0;

    return {
      traineeId: trainee.id,
      traineeName: trainee.name,
      profession: trainee.profession?.name ?? null,
      totalReports,
      ...statusCounts,
      completionPercent,
      missingWeeks,
    };
  });

  return NextResponse.json(result);
}
