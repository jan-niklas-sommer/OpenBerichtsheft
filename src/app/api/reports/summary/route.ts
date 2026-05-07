import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const now = new Date();
  const currentYear = now.getFullYear();
  const jan4 = new Date(currentYear, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1);
  const currentWeek = Math.ceil((now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000));

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
      traineeReports.map((r) => `${r.calendarYear}-${r.calendarWeek}`)
    );

    const missingWeeks: { year: number; week: number }[] = [];
    const startYear = currentYear;
    const startWeek = Math.max(1, currentWeek - 12);
    for (let w = startWeek; w <= currentWeek; w++) {
      if (!existingWeeks.has(`${startYear}-${w}`)) {
        missingWeeks.push({ year: startYear, week: w });
      }
    }

    const completionPercent = Math.min(100, Math.round((statusCounts.approved / Math.max(currentWeek, 1)) * 100));

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
