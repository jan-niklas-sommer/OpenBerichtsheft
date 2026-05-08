import { prisma } from "@/lib/prisma";
import { getIsoWeek } from "@/lib/utils";
import { ReviewerDashboardClient } from "./reviewer-dashboard-client";

interface ReviewerDashboardProps {
  userId: string;
  role: "trainer" | "training_officer";
  title: string;
  basePath: string;
}

interface TraineeWithReports {
  id: string;
  name: string;
  profession: string | null;
  trainingStartDate: string | null;
  reports: {
    id: string;
    calendarYear: number;
    calendarWeek: number;
    status: string;
    submittedAt: string | null;
  }[];
}

export async function ReviewerDashboard({ userId, role, title, basePath }: ReviewerDashboardProps) {
  let assignments: { traineeId: string; trainee: { id: string; name: string; profession: { name: string } | null; trainingStartDate: Date | null } }[] = [];

  if (role === "trainer") {
    assignments = await prisma.traineeTrainerAssignment.findMany({
      where: { trainerId: userId },
      include: { trainee: { select: { id: true, name: true, profession: { select: { name: true } }, trainingStartDate: true } } },
    });
  } else {
    assignments = await prisma.traineeOfficerAssignment.findMany({
      where: { trainingOfficerId: userId },
      include: { trainee: { select: { id: true, name: true, profession: { select: { name: true } }, trainingStartDate: true } } },
    });
  }

  const traineeIds = assignments.map((a) => a.traineeId);

  const allReports = await prisma.weeklyReport.findMany({
    where: { traineeId: { in: traineeIds } },
    select: {
      id: true,
      traineeId: true,
      calendarYear: true,
      calendarWeek: true,
      status: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const { year: currentYear, week: currentWeek } = getIsoWeek(new Date());

  const traineeData: TraineeWithReports[] = assignments.map((a) => ({
    id: a.trainee.id,
    name: a.trainee.name,
    profession: a.trainee.profession?.name ?? null,
    trainingStartDate: a.trainee.trainingStartDate?.toISOString() ?? null,
    reports: allReports
      .filter((r) => r.traineeId === a.trainee.id)
      .map((r) => ({
        id: r.id,
        calendarYear: r.calendarYear,
        calendarWeek: r.calendarWeek,
        status: r.status,
        submittedAt: r.submittedAt?.toISOString() ?? null,
      })),
  }));

  return (
    <ReviewerDashboardClient
      title={title}
      basePath={basePath}
      trainees={traineeData}
      currentYear={currentYear}
      currentWeek={currentWeek}
    />
  );
}
