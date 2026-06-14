import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.trainerProfessionAssignment.findMany({
    include: {
      trainer: { select: { id: true, name: true, email: true, role: true } },
      profession: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { trainerId, professionId } = parsed.data;

  const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
  const profession = await prisma.trainingProfession.findUnique({ where: { id: professionId } });

  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json({ error: "Invalid trainer" }, { status: 400 });
  }
  if (!profession) {
    return NextResponse.json({ error: "Invalid profession" }, { status: 400 });
  }

  const assignment = await prisma.trainerProfessionAssignment.upsert({
    where: {
      trainerId_professionId: { trainerId, professionId },
    },
    create: { trainerId, professionId },
    update: {},
    include: {
      trainer: { select: { id: true, name: true, email: true } },
      profession: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

