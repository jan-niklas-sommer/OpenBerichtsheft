import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { PdfDocument } from "@/components/reports/pdf-document";

export const runtime = "nodejs";

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
      trainee: { select: { id: true, name: true, profession: { select: { id: true, name: true } } } },
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

  const serialized = {
    ...report,
    reportType: report.reportType,
    weekStartDate: report.weekStartDate.toISOString(),
    weekEndDate: report.weekEndDate.toISOString(),
    submittedAt: report.submittedAt?.toISOString() ?? null,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    dailyEntries: report.dailyEntries.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };

  const stream = await renderToStream(<PdfDocument report={serialized} />);
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

  const filename = `berichtsheft-KW${report.calendarWeek}-${report.calendarYear}.pdf`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
