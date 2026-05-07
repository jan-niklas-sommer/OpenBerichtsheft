import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  if (role !== "trainee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.traineeId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (report.status !== "draft" && report.status !== "needs_revision") {
    return NextResponse.json({ error: "Cannot submit" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.weeklyReport.findUnique({ where: { id } });
      if (!locked || (locked.status !== "draft" && locked.status !== "needs_revision")) {
        throw new Error("Cannot submit");
      }
      const updated = await tx.weeklyReport.update({
        where: { id },
        data: {
          status: "submitted",
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedById: null,
          reviewComment: null,
        },
      });
      await tx.reviewEvent.create({
        data: {
          weeklyReportId: id,
          actorId: userId,
          action: "submitted",
        },
      });
      return updated;
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Cannot submit") {
      return NextResponse.json({ error: "Cannot submit" }, { status: 400 });
    }
    throw e;
  }
}
