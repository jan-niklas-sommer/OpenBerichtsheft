import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { weekdayToBit } from "@/lib/schedule-resolver";
import { updateRecurrenceRuleSchema, scheduleTypeSchema } from "@/lib/validations";

const createRuleSchema = z.object({
  traineeId: z.string().uuid(),
  scheduleType: scheduleTypeSchema,
  startDate: z.string(),
  endDate: z.string(),
  weekDays: z.union([
    z.number().int().min(1).max(127),
    z.array(z.number().int().min(1).max(7)).min(1),
  ]),
  displayLabel: z.string().optional(),
  department: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  const url = new URL(req.url);
  const traineeId = url.searchParams.get("traineeId");

  if (role === "admin" || role === "trainer" || role === "training_officer") {
    const where: Record<string, unknown> = {};
    if (traineeId) where.traineeId = traineeId;

    if (role === "trainer") {
      const professionAssignments = await prisma.trainerProfessionAssignment.findMany({
        where: { trainerId: userId },
        select: { professionId: true },
      });
      const professionIds = professionAssignments.map((a) => a.professionId);
      const trainees = await prisma.user.findMany({
        where: { role: "trainee", professionId: { in: professionIds }, deactivatedAt: null },
        select: { id: true },
      });
      where.traineeId = { in: trainees.map((t) => t.id) };
    }

    const rules = await prisma.recurrenceRule.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, profession: { select: { name: true } } } },
        supervisor: { select: { id: true, name: true } },
        exceptions: true,
      },
      orderBy: [{ traineeId: "asc" }, { startDate: "asc" }],
    });
    return NextResponse.json(rules);
  }

  if (role === "trainee") {
    const rules = await prisma.recurrenceRule.findMany({
      where: { traineeId: userId },
      include: {
        trainee: { select: { id: true, name: true, profession: { select: { name: true } } } },
        supervisor: { select: { id: true, name: true } },
        exceptions: true,
      },
      orderBy: [{ startDate: "asc" }],
    });
    return NextResponse.json(rules);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { traineeId, scheduleType, startDate, endDate, weekDays, displayLabel, department, supervisorId } = parsed.data;

  if (role === "trainer") {
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      select: { professionId: true },
    });
    if (!trainee?.professionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const professionAssignment = await prisma.trainerProfessionAssignment.findFirst({
      where: { trainerId: userId, professionId: trainee.professionId },
    });
    if (!professionAssignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const weekDaysBitfield = typeof weekDays === "number"
    ? weekDays
    : weekDays.reduce((acc, day) => acc | weekdayToBit(day), 0);

  const rule = await prisma.recurrenceRule.create({
    data: {
      traineeId,
      scheduleType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      weekDays: weekDaysBitfield,
      displayLabel: displayLabel || null,
      department: department || null,
      supervisorId: supervisorId || null,
      createdById: userId,
    },
    include: {
      trainee: { select: { id: true, name: true, profession: { select: { name: true } } } },
      supervisor: { select: { id: true, name: true } },
      exceptions: true,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateRecurrenceRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...updates } = parsed.data;

  if (role === "trainer") {
    const existing = await prisma.recurrenceRule.findUnique({ where: { id } });
    if (!existing || existing.createdById !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (role === "trainer") {
    const existing = await prisma.recurrenceRule.findUnique({ where: { id } });
    if (!existing || existing.createdById !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    await prisma.recurrenceRule.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
