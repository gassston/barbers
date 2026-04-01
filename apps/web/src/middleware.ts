import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/client", "/admin"];
const ADMIN_ONLY_PREFIXES = ["/admin"];
const AUTH_COOKIE = "better-auth.session_token";
const AUTH_COOKIE_SECURE = "__Secure-better-auth.session_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionToken =
    request.cookies.get(AUTH_COOKIE_SECURE)?.value ??
    request.cookies.get(AUTH_COOKIE)?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role check for admin routes happens server-side in the page/layout.
  // Middleware only verifies session existence (lightweight, no DB call).
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*"],
};
