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
  let traineeIds: string[] = [];
  let traineeMap: Map<string, { id: string; name: string; profession: { name: string } | null; trainingStartDate: Date | null }> = new Map();

  if (role === "trainer") {
    const professionAssignments = await prisma.trainerProfessionAssignment.findMany({
      where: { trainerId: userId },
      select: { professionId: true },
    });
    const professionIds = professionAssignments.map((a) => a.professionId);
    if (professionIds.length > 0) {
      const trainees = await prisma.user.findMany({
        where: { role: "trainee", professionId: { in: professionIds } },
        select: { id: true, name: true, profession: { select: { name: true } }, trainingStartDate: true },
      });
      traineeIds = trainees.map((t) => t.id);
      traineeMap = new Map(trainees.map((t) => [t.id, t]));
    }
  } else {
    const officerAssignments = await prisma.traineeOfficerAssignment.findMany({
      where: { trainingOfficerId: userId },
      include: { trainee: { select: { id: true, name: true, profession: { select: { name: true } }, trainingStartDate: true } } },
    });
    traineeIds = officerAssignments.map((a) => a.traineeId);
    traineeMap = new Map(officerAssignments.map((a) => [a.trainee.id, a.trainee]));
  }

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

  const traineeData: TraineeWithReports[] = traineeIds.map((id) => {
    const trainee = traineeMap.get(id)!;
    return {
      id: trainee.id,
      name: trainee.name,
      profession: trainee.profession?.name ?? null,
      trainingStartDate: trainee.trainingStartDate?.toISOString() ?? null,
      reports: allReports
        .filter((r) => r.traineeId === id)
        .map((r) => ({
          id: r.id,
          calendarYear: r.calendarYear,
          calendarWeek: r.calendarWeek,
          status: r.status,
          submittedAt: r.submittedAt?.toISOString() ?? null,
        })),
    };
  });

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
