import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReportSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: {
      dailyEntries: { orderBy: { date: "asc" } },
      trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = session.user.role;
  const userId = session.user.id;

  if (role === "trainee" && report.traineeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "trainer") {
    const assignment = await prisma.traineeTrainerAssignment.findFirst({
      where: { traineeId: report.traineeId, trainerId: userId },
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "training_officer") {
    const assignment = await prisma.traineeOfficerAssignment.findFirst({
      where: { traineeId: report.traineeId, trainingOfficerId: userId },
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(report);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role;
  const userId = session.user.id;

  if (role !== "trainee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.traineeId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (report.status !== "draft" && report.status !== "needs_revision") {
    return NextResponse.json({ error: "Report is not editable" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { reportText, dailyEntries } = parsed.data;

  const updated = await prisma.weeklyReport.update({
    where: { id },
    data: {
      ...(reportText !== undefined && { reportText: reportText || null }),
      ...(dailyEntries && {
        dailyEntries: {
          deleteMany: {},
          create: dailyEntries.map((entry) => ({
            date: new Date(entry.date),
            dayType: entry.dayType,
            hours: entry.hours,
            minutes: entry.minutes,
          })),
        },
      }),
    },
    include: { dailyEntries: { orderBy: { date: "asc" } } },
  });

  return NextResponse.json(updated);
}
