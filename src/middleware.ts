import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // For demonstration purposes, we're not implementing actual auth checking in middleware
  // In a real app, you would check for auth tokens in cookies/headers here

  // Just pass through all requests
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
