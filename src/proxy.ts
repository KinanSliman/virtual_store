import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  allowsUnauthenticatedAccess,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Guards the dashboard. Everything under /dashboard can change the catalogue,
 * so an unauthenticated request is sent to the login page with the destination
 * preserved.
 *
 * This is the coarse gate; the login page and its action do the actual
 * password check.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (allowsUnauthenticatedAccess()) return NextResponse.next();
  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/dashboard/:path*",
};
