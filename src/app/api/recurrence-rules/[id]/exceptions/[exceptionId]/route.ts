import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function assertOwnsRule(userId: string, role: string, ruleId: string) {
  if (role === "admin") return true;
  const rule = await prisma.recurrenceRule.findUnique({
    where: { id: ruleId },
    select: { createdById: true },
  });
  return !!rule && rule.createdById === userId;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; exceptionId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ruleId, exceptionId } = await params;

  const owns = await assertOwnsRule(session.user.id, role, ruleId);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Compound-Where stellt sicher, dass die Exception zur Regel im Pfad gehört.
    await prisma.recurrenceException.delete({ where: { id: exceptionId, ruleId } });
  } catch {
    return NextResponse.json({ error: "Ausnahme nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
