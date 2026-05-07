import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(null, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
  return NextResponse.json(session, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
