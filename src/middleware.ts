import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // All paths are public in this version - no forced redirects
  // This matches the storyboard flow where users can browse without an account

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
