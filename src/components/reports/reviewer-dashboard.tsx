import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, statusVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FileText } from "lucide-react";

interface ReviewerDashboardProps {
  userId: string;
  role: "trainer" | "training_officer";
  title: string;
  basePath: string;
}

export async function ReviewerDashboard({ userId, role, title, basePath }: ReviewerDashboardProps) {
  let traineeIds: string[] = [];

  if (role === "trainer") {
    const assignments = await prisma.traineeTrainerAssignment.findMany({
      where: { trainerId: userId },
      include: { trainee: { select: { id: true, name: true } } },
    });
    traineeIds = assignments.map((a) => a.traineeId);
  } else {
    const assignments = await prisma.traineeOfficerAssignment.findMany({
      where: { trainingOfficerId: userId },
      include: { trainee: { select: { id: true, name: true } } },
    });
    traineeIds = assignments.map((a) => a.traineeId);
  }

  const reports = await prisma.weeklyReport.findMany({
    where: { traineeId: { in: traineeIds }, status: "submitted" },
    include: {
      trainee: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {reports.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="text-neutral-500">Keine offenen Berichte zu prüfen.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`${basePath}/report/${report.id}`}>
              <Card className="mb-3 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      KW {report.calendarWeek}/{report.calendarYear}
                    </p>
                    <p className="text-sm text-neutral-500">
                      von {report.trainee.name}
                    </p>
                  </div>
                  <Badge variant={statusVariant(report.status)}>
                    {STATUS_LABELS[report.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
