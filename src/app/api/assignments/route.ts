import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.traineeTrainerAssignment.findMany({
    include: {
      trainee: { select: { id: true, name: true, email: true, role: true } },
      trainer: { select: { id: true, name: true, email: true, role: true } },
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

  const { traineeId, trainerId } = parsed.data;

  const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
  const trainer = await prisma.user.findUnique({ where: { id: trainerId } });

  if (!trainee || trainee.role !== "trainee") {
    return NextResponse.json({ error: "Invalid trainee" }, { status: 400 });
  }
  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json({ error: "Invalid trainer" }, { status: 400 });
  }

  const assignment = await prisma.traineeTrainerAssignment.upsert({
    where: {
      traineeId_trainerId: { traineeId, trainerId },
    },
    create: { traineeId, trainerId },
    update: {},
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      trainer: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.traineeTrainerAssignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
