import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSettingsSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.appSetting.findMany();
  const result: Record<string, unknown> = {};
  for (const s of settings) {
    try {
      result[s.key] = JSON.parse(s.value);
    } catch {
      result[s.key] = s.value;
    }
  }

  if (!result.workingDays) {
    result.workingDays = [1, 2, 3, 4, 5];
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { workingDays } = parsed.data;

  await prisma.appSetting.upsert({
    where: { key: "workingDays" },
    update: { value: JSON.stringify(workingDays) },
    create: { key: "workingDays", value: JSON.stringify(workingDays) },
  });

  return NextResponse.json({ workingDays });
}
