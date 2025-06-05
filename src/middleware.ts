import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get session from cookie
  const { data: { session } } = await supabase.auth.getSession();

  // If user is not logged in and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is logged in, check subscription status for premium features
  if (session) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .single();

    // Redirect to pricing page if trying to access premium features without subscription
    if (!subscription?.status || subscription.status !== "active") {
      const premiumRoutes = ["/premium-features", "/advanced-practice"];
      if (premiumRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/pricing", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/premium-features/:path*",
    "/advanced-practice/:path*",
  ],
};
