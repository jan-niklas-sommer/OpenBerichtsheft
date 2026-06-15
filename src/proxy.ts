import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: "Middleware" heißt nun "Proxy" (gleiche Funktionalität, neuer Name).
export function proxy(request: NextRequest) {
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|forgot-password|reset-password|api/auth|api/notifications/check|_next/static|_next/image|favicon.ico).*)"],
};
