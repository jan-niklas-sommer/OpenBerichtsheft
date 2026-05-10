import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.anonymizedAt) return NextResponse.json({ error: "Already anonymized" }, { status: 400 });
  if (!user.deactivatedAt) return NextResponse.json({ error: "User must be deactivated first" }, { status: 400 });

  const anonymized = await prisma.user.update({
    where: { id },
    data: {
      name: "Anonym",
      email: `anonym-${id}@deleted`,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
      professionId: null,
      anonymizedAt: new Date(),
    },
    select: { id: true, name: true, email: true, role: true, anonymizedAt: true },
  });

  return NextResponse.json(anonymized);
}
