import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    delete data.password;
  }
  if (parsed.data.trainingStartDate !== undefined) {
    data.trainingStartDate = parsed.data.trainingStartDate ? new Date(parsed.data.trainingStartDate) : null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, professionId: true, trainingStartDate: true, createdAt: true, deactivatedAt: true },
  });

  return NextResponse.json(user);
}
