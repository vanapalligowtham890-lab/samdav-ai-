import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes requiring user login
const PROTECTED_PREFIXES = ["/today", "/calls", "/settings", "/setup", "/leads"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get("vaani_session");
    const isAuthenticated = sessionCookie?.value === "active";

    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today/:path*",
    "/today",
    "/calls/:path*",
    "/calls",
    "/settings/:path*",
    "/settings",
    "/setup/:path*",
    "/setup",
    "/leads/:path*",
  ],
};

