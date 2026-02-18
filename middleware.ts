import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifySessionToken(token) : false;

  if (pathname.startsWith(DASHBOARD_PATH) && !isAuthenticated) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith(LOGIN_PATH) && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
