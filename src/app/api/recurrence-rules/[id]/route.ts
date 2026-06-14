import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { updateRecurrenceRuleSchema } from "@/lib/validations";
import { weekdayToBit } from "@/lib/schedule-resolver";

async function assertOwnsRule(role: string, userId: string, id: string) {
  if (role === "admin") return true;
  const existing = await prisma.recurrenceRule.findUnique({
    where: { id },
    select: { createdById: true },
  });
  return !!existing && existing.createdById === userId;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!(await assertOwnsRule(role, userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateRecurrenceRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const updates = parsed.data;

  const data: Record<string, unknown> = {};
  if (updates.scheduleType) data.scheduleType = updates.scheduleType;
  if (updates.startDate) data.startDate = new Date(updates.startDate);
  if (updates.endDate) data.endDate = new Date(updates.endDate);
  if (updates.weekDays !== undefined) {
    data.weekDays = typeof updates.weekDays === "number"
      ? updates.weekDays
      : updates.weekDays.reduce((acc, day) => acc | weekdayToBit(day), 0);
  }
  if (updates.displayLabel !== undefined) data.displayLabel = updates.displayLabel || null;
  if (updates.department !== undefined) data.department = updates.department || null;
  if (updates.supervisorId !== undefined) data.supervisorId = updates.supervisorId || null;
  if (updates.interval !== undefined) data.interval = updates.interval;
  if (Object.keys(data).length > 0) {
    data.updatedById = userId;
  }

  const rule = await prisma.recurrenceRule.update({
    where: { id },
    data,
    include: {
      trainee: { select: { id: true, name: true, profession: { select: { name: true } } } },
      supervisor: { select: { id: true, name: true } },
      exceptions: true,
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!(await assertOwnsRule(role, userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.recurrenceRule.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
