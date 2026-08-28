import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "dlrs_session"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

  // 1. Protected workspace routes: redirect to /login if no session cookie
  if (
    pathname.startsWith("/w/") ||
    pathname === "/w" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/workspaces")
  ) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      // Save return URL for smooth post-login redirect
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 2. Auth routes: redirect to /dashboard if already logged in
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/w/:path*",
    "/dashboard/:path*",
    "/dashboard",
    "/workspaces/:path*",
    "/login",
  ],
}
