import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createExceptionSchema } from "@/lib/validations";

async function assertOwnsRule(userId: string, role: string, ruleId: string) {
  if (role === "admin") return { ok: true as const };
  const rule = await prisma.recurrenceRule.findUnique({
    where: { id: ruleId },
    select: { createdById: true },
  });
  if (!rule) return { ok: false as const, status: 404 };
  if (rule.createdById !== userId) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ruleId } = await params;

  const rule = await prisma.recurrenceRule.findUnique({
    where: { id: ruleId },
    select: { id: true, createdById: true, startDate: true, endDate: true },
  });
  if (!rule) {
    return NextResponse.json({ error: "Regel nicht gefunden" }, { status: 404 });
  }
  if (role === "trainer" && rule.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createExceptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 });
  }

  try {
    const exception = await prisma.recurrenceException.create({
      data: {
        ruleId,
        date,
        reason: parsed.data.reason || null,
      },
    });
    return NextResponse.json(exception, { status: 201 });
  } catch {
    // Wahrscheinlich Unique-Constraint-Verletzung (Datum existiert bereits als Ausnahme)
    return NextResponse.json(
      { error: "Für dieses Datum existiert bereits eine Ausnahme" },
      { status: 409 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "admin" && role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ruleId } = await params;
  const url = new URL(req.url);
  const exceptionId = url.searchParams.get("exceptionId");
  if (!exceptionId) {
    return NextResponse.json({ error: "exceptionId erforderlich" }, { status: 400 });
  }

  const access = await assertOwnsRule(session.user.id, role, ruleId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 404 ? "Regel nicht gefunden" : "Forbidden" },
      { status: access.status },
    );
  }

  try {
    // Compound-Check: stellt sicher, dass die Exception tatsächlich zur Regel
    // im Pfad gehört (verhindert Cross-Regel-Löschung via fremder exceptionId).
    await prisma.recurrenceException.delete({ where: { id: exceptionId, ruleId } });
  } catch {
    return NextResponse.json({ error: "Ausnahme nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
