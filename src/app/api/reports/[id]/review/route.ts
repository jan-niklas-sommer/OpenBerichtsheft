import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { ReportStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role;
  const userId = session.user.id;

  if (role !== "trainer" && role !== "training_officer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.status !== "submitted") {
    return NextResponse.json({ error: "Report is not in reviewable state" }, { status: 400 });
  }

  if (role === "trainer") {
    const trainee = await prisma.user.findUnique({
      where: { id: report.traineeId },
      select: { professionId: true },
    });
    if (!trainee?.professionId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const professionAssignment = await prisma.trainerProfessionAssignment.findFirst({
      where: { trainerId: userId, professionId: trainee.professionId },
    });
    if (!professionAssignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "training_officer") {
    const assignment = await prisma.traineeOfficerAssignment.findFirst({
      where: {
        traineeId: report.traineeId,
        trainingOfficerId: userId,
        validFrom: { lte: report.weekStartDate },
        validUntil: { gte: report.weekEndDate },
      },
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { action, comment } = parsed.data;

  const statusMap: Record<string, string> = {
    approved: "approved",
    needs_revision: "needs_revision",
    rejected: "rejected",
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.weeklyReport.findUnique({ where: { id } });
      if (!locked || locked.status !== "submitted") {
        throw new Error("Report is not in reviewable state");
      }
      const updated = await tx.weeklyReport.update({
        where: { id },
        data: {
          status: statusMap[action] as ReportStatus,
          reviewedAt: new Date(),
          reviewedById: userId,
          reviewComment: comment || null,
        },
      });
      await tx.reviewEvent.create({
        data: {
          weeklyReportId: id,
          actorId: userId,
          action: action as "approved" | "needs_revision" | "rejected",
          comment: comment || null,
        },
      });
      return updated;
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Report is not in reviewable state") {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
