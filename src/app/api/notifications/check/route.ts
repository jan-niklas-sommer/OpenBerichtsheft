import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIsoWeek } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const trainees = await prisma.user.findMany({
    where: { role: "trainee", deactivatedAt: null },
    select: { id: true, trainingStartDate: true },
  });

  const { year: currentYear, week: currentWeek } = getIsoWeek(new Date());

  const existingReports = await prisma.weeklyReport.findMany({
    where: {
      traineeId: { in: trainees.map((t) => t.id) },
      calendarYear: currentYear,
    },
    select: { traineeId: true, calendarWeek: true },
  });

  const existingSet = new Set(existingReports.map((r) => `${r.traineeId}-${r.calendarWeek}`));

  const recentNotifications = await prisma.notification.findMany({
    where: {
      type: "missing_report",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, message: true },
  });

  const notifiedSet = new Set(recentNotifications.map((n) => `${n.userId}-${n.message}`));

  let created = 0;
  for (const trainee of trainees) {
    const startWeek = trainee.trainingStartDate
      ? getIsoWeek(trainee.trainingStartDate)
      : { year: currentYear, week: Math.max(1, currentWeek - 2) };

    const lowerBound = Math.max(1, currentWeek - 2);

    for (let w = lowerBound; w < currentWeek; w++) {
      if (startWeek.year === currentYear && w < startWeek.week) continue;
      if (startWeek.year > currentYear) continue;

      if (!existingSet.has(`${trainee.id}-${w}`)) {
        const msg = `KW ${w}/${currentYear}`;
        if (!notifiedSet.has(`${trainee.id}-${msg}`)) {
          await prisma.notification.create({
            data: {
              userId: trainee.id,
              type: "missing_report",
              message: `Fehlender Wochenbericht für ${msg}`,
            },
          });
          created++;
        }
      }
    }
  }

  return NextResponse.json({ created, traineesChecked: trainees.length });
}
