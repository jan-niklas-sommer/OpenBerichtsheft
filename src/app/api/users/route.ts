import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const url = new URL(req.url);
  const roleFilter = url.searchParams.get("role");

  if (role === "admin") {
    const where: Record<string, unknown> = {};
    if (roleFilter) where.role = roleFilter;
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, role: true, professionId: true,
        profession: { select: { id: true, name: true } },
        trainingStartDate: true, createdAt: true, deactivatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  }

  if (role === "trainer") {
    const professionAssignments = await prisma.trainerProfessionAssignment.findMany({
      where: { trainerId: session.user.id },
      select: { professionId: true },
    });
    const professionIds = professionAssignments.map((a) => a.professionId);

    if (roleFilter === "trainee") {
      const trainees = await prisma.user.findMany({
        where: { role: "trainee", professionId: { in: professionIds }, deactivatedAt: null },
        select: { id: true, name: true, email: true, trainingStartDate: true },
      });
      return NextResponse.json(trainees);
    }

    if (roleFilter === "training_officer") {
      const myTraineeIds = await prisma.user.findMany({
        where: { role: "trainee", professionId: { in: professionIds }, deactivatedAt: null },
        select: { id: true },
      });
      const tIds = myTraineeIds.map((t) => t.id);
      const assignments = await prisma.traineeOfficerAssignment.findMany({
        where: { traineeId: { in: tIds } },
        select: { trainingOfficerId: true },
      });
      const officerIds = [...new Set(assignments.map((a) => a.trainingOfficerId))];
      const officers = await prisma.user.findMany({
        where: { id: { in: officerIds }, deactivatedAt: null },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json(officers);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, role: userRole, password, professionId, trainingStartDate } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email, name, role: userRole, passwordHash,
      emailVerified: new Date(),
      ...(professionId && { professionId }),
      ...(trainingStartDate && { trainingStartDate: new Date(trainingStartDate) }),
    },
    select: { id: true, email: true, name: true, role: true, professionId: true, trainingStartDate: true, createdAt: true, deactivatedAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
