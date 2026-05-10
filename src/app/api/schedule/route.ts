import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateScheduleSchema } from "@/lib/validations";

const createSchema = z.object({
  traineeId: z.string().uuid(),
  scheduleType: z.enum(["department", "school", "vacation", "other"]),
  startDate: z.string(),
  endDate: z.string(),
  department: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

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
    const traineeIds = trainees.map((t) => t.id);

    const where: Record<string, unknown> = { traineeId: { in: traineeIds } };
    if (start && end) {
      where.startDate = { lte: new Date(end) };
      where.endDate = { gte: new Date(start) };
    }

    const assignments = await prisma.scheduleAssignment.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ traineeId: "asc" }, { startDate: "asc" }],
    });
    return NextResponse.json(assignments);
  }

  if (role === "training_officer") {
    const officerAssignments = await prisma.traineeOfficerAssignment.findMany({
      where: { trainingOfficerId: userId },
      select: { traineeId: true, validFrom: true, validUntil: true },
    });

    const traineeIds = [...new Set(officerAssignments.map((oa) => oa.traineeId))];

    const where: Record<string, unknown> = {
      traineeId: { in: traineeIds },
    };
    if (start && end) {
      where.startDate = { lte: new Date(end) };
      where.endDate = { gte: new Date(start) };
    }

    const allAssignments = await prisma.scheduleAssignment.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ traineeId: "asc" }, { startDate: "asc" }],
    });

    const filtered = allAssignments.filter((a) =>
      officerAssignments.some((oa) =>
        oa.traineeId === a.traineeId &&
        new Date(a.startDate) <= oa.validUntil &&
        new Date(a.endDate) >= oa.validFrom
      )
    );

    return NextResponse.json(filtered);
  }

  if (role === "admin") {
    const where: Record<string, unknown> = {};
    if (start && end) {
      where.startDate = { lte: new Date(end) };
      where.endDate = { gte: new Date(start) };
    }
    const assignments = await prisma.scheduleAssignment.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ traineeId: "asc" }, { startDate: "asc" }],
    });
    return NextResponse.json(assignments);
  }

  if (role === "trainee") {
    const where: Record<string, unknown> = { traineeId: userId };
    if (start && end) {
      where.startDate = { lte: new Date(end) };
      where.endDate = { gte: new Date(start) };
    }
    const assignments = await prisma.scheduleAssignment.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, email: true, profession: { select: { id: true, name: true } } } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ startDate: "asc" }],
    });
    return NextResponse.json(assignments);
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { traineeId, scheduleType, startDate, endDate, department, supervisorId } = parsed.data;

  const targetUser = await prisma.user.findUnique({
    where: { id: traineeId },
    select: { role: true, professionId: true },
  });
  if (!targetUser || targetUser.role !== "trainee") {
    return NextResponse.json({ error: "traineeId must reference a user with role 'trainee'" }, { status: 400 });
  }

  if (role === "trainer") {
    if (!targetUser.professionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const professionAssignment = await prisma.trainerProfessionAssignment.findFirst({
      where: { trainerId: userId, professionId: targetUser.professionId },
    });
    if (!professionAssignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const assignment = await prisma.scheduleAssignment.create({
    data: {
      traineeId,
      scheduleType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      department: department || null,
      supervisorId: supervisorId || null,
      createdBy: userId,
    },
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      supervisor: { select: { id: true, name: true, email: true } },
    },
  });

  if (supervisorId && scheduleType === "department") {
    const officer = await prisma.user.findUnique({
      where: { id: supervisorId },
      select: { role: true },
    });
    if (officer?.role === "training_officer") {
      const existing = await prisma.traineeOfficerAssignment.findFirst({
        where: {
          traineeId,
          trainingOfficerId: supervisorId,
          validFrom: { lte: new Date(startDate) },
          validUntil: { gte: new Date(endDate) },
        },
      });
      if (!existing) {
        await prisma.traineeOfficerAssignment.create({
          data: {
            traineeId,
            trainingOfficerId: supervisorId,
            assignedById: userId,
            validFrom: new Date(startDate),
            validUntil: new Date(endDate),
          },
        });
      }
    }
  }

  return NextResponse.json(assignment, { status: 201 });
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
  const parsed = updateScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...updates } = parsed.data;

  if (role === "trainer") {
    const existing = await prisma.scheduleAssignment.findUnique({ where: { id } });
    if (!existing || existing.createdBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const data: Record<string, unknown> = {};
  if (updates.scheduleType) data.scheduleType = updates.scheduleType;
  if (updates.startDate) data.startDate = new Date(updates.startDate);
  if (updates.endDate) data.endDate = new Date(updates.endDate);
  if (updates.department !== undefined) data.department = updates.department || null;
  if (updates.supervisorId !== undefined) data.supervisorId = updates.supervisorId || null;

  const assignment = await prisma.scheduleAssignment.update({
    where: { id },
    data,
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      supervisor: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(assignment);
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
    const existing = await prisma.scheduleAssignment.findUnique({ where: { id } });
    if (!existing || existing.createdBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    await prisma.scheduleAssignment.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
