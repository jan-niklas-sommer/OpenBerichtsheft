import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { PdfBatchDocument } from "@/components/reports/pdf-document";
import { z } from "zod";

export const runtime = "nodejs";

const exportParamsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const parsed = exportParamsSchema.safeParse({ from, to });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
  }

  const fromDate = new Date(parsed.data.from);
  const toDate = new Date(parsed.data.to);
  toDate.setUTCHours(23, 59, 59, 999);

  if (fromDate > toDate) {
    return NextResponse.json({ error: "from must be before to" }, { status: 400 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  let traineeId: string | undefined;

  if (role === "trainee") {
    traineeId = userId;
  } else if (role === "trainer") {
    const targetId = searchParams.get("traineeId");
    if (!targetId) {
      return NextResponse.json({ error: "traineeId required for trainers" }, { status: 400 });
    }
    const trainee = await prisma.user.findUnique({
      where: { id: targetId },
      select: { professionId: true },
    });
    if (!trainee?.professionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const assignment = await prisma.trainerProfessionAssignment.findFirst({
      where: { trainerId: userId, professionId: trainee.professionId },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    traineeId = targetId;
  } else if (role === "training_officer") {
    const targetId = searchParams.get("traineeId");
    if (!targetId) {
      return NextResponse.json({ error: "traineeId required for officers" }, { status: 400 });
    }
    const assignment = await prisma.traineeOfficerAssignment.findFirst({
      where: {
        traineeId: targetId,
        trainingOfficerId: userId,
        validFrom: { lte: toDate },
        validUntil: { gte: fromDate },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    traineeId = targetId;
  } else if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "admin" && searchParams.get("traineeId")) {
    traineeId = searchParams.get("traineeId")!;
  }

  const where: Record<string, unknown> = {
    weekStartDate: { gte: fromDate },
    weekEndDate: { lte: toDate },
  };
  if (traineeId) {
    where.traineeId = traineeId;
  }

  const reports = await prisma.weeklyReport.findMany({
    where,
    include: {
      dailyEntries: { orderBy: { date: "asc" } },
      trainee: { select: { id: true, name: true, profession: { select: { id: true, name: true } } } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ calendarYear: "asc" }, { calendarWeek: "asc" }],
  });

  if (reports.length === 0) {
    return NextResponse.json({ error: "No reports found in date range" }, { status: 404 });
  }

  const serialized = reports.map((report) => ({
    ...report,
    reportType: report.reportType,
    weekStartDate: report.weekStartDate.toISOString(),
    weekEndDate: report.weekEndDate.toISOString(),
    submittedAt: report.submittedAt?.toISOString() ?? null,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reviewComment: report.reviewComment,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    dailyEntries: report.dailyEntries.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  }));

  const traineeName = serialized[0]?.trainee?.name || "Unbekannt";

  const stream = await renderToStream(
    <PdfBatchDocument reports={serialized} traineeName={traineeName} />
  );
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

  const filename = `berichtsheft_${parsed.data.from}_${parsed.data.to}.pdf`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
