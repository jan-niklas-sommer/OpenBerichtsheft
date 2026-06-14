import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { officerAssignmentSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = role === "trainer" ? { assignedById: session.user.id } : {};

  const assignments = await prisma.traineeOfficerAssignment.findMany({
    where,
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      trainingOfficer: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
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
  const parsed = officerAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { traineeId, trainingOfficerId, validFrom, validUntil } = parsed.data;

  const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
  const officer = await prisma.user.findUnique({ where: { id: trainingOfficerId } });

  if (!trainee || trainee.role !== "trainee") {
    return NextResponse.json({ error: "Invalid trainee" }, { status: 400 });
  }
  if (!officer || officer.role !== "training_officer") {
    return NextResponse.json({ error: "Invalid training officer" }, { status: 400 });
  }

  if (role === "trainer") {
    const traineeProfessionId = trainee.professionId;
    if (!traineeProfessionId) {
      return NextResponse.json({ error: "Not assigned to this trainee" }, { status: 403 });
    }
    const professionAssignment = await prisma.trainerProfessionAssignment.findFirst({
      where: { trainerId: userId, professionId: traineeProfessionId },
    });
    if (!professionAssignment) {
      return NextResponse.json({ error: "Not assigned to this trainee" }, { status: 403 });
    }
  }

  const assignment = await prisma.traineeOfficerAssignment.create({
    data: {
      traineeId,
      trainingOfficerId,
      assignedById: userId,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
    },
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      trainingOfficer: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

