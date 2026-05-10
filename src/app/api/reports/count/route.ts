import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const countParamsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = countParamsSchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const fromDate = new Date(parsed.data.from);
  const toDate = new Date(parsed.data.to);
  toDate.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    weekStartDate: { gte: fromDate },
    weekEndDate: { lte: toDate },
  };

  if (session.user.role === "trainee") {
    where.traineeId = session.user.id;
  }

  const count = await prisma.weeklyReport.count({ where });
  return NextResponse.json({ count });
}
