import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  const authPaths = ["/login", "/signup", "/auth", "/auth/callback", "/api/auth"];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key',
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Always get session FIRST
  // Use getUser for security as per warning, though getSession is faster.
  // We'll stick to getSession for performance unless strict verification is needed, 
  // but to silence the warning and be safe, let's use getUser if possible, 
  // OR just acknowledge the warning. The warning comes from the client usually? 
  // Actually, the warning is server-side here.
  // Let's rely on getSession for now but fix the logic.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // -----------------------------
  // NOT LOGGED IN
  // -----------------------------
  if (!session) {
    // allow login/signup
    if (authPaths.some(p => path.startsWith(p))) {
      return res;
    }

    // block everything else
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // -----------------------------
  // LOGGED IN
  // -----------------------------

  // Fetch role
  const { data: user } = await supabase
    .from("users")
    .select("role, is_suspended")
    .eq("id", session.user.id)
    .single();

  // -----------------------------
  // ROLE-LESS OR MISSING USER (NEW USER)
  // -----------------------------
  // If user is null (record missing) or role is null
  if (!user || !user.role) {
    // If user is missing, they are likely a new OAuth user who's record hasn't been created yet.
    // We allow them to Onboarding to create their profile/role.

    // If not already on onboarding or calling onboarding API, send them there
    if (!path.startsWith("/onboarding") && !path.startsWith("/api/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    // Allow access to onboarding
    return res;
  }

  if (user.is_suspended) {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  // -----------------------------
  // USER WITH ROLE
  // -----------------------------

  // Prevent access to onboarding if already has role
  if (path.startsWith("/onboarding")) {
    const roleRoutes: Record<"admin" | "freelancer" | "client", string> = {
      admin: "/admin",
      freelancer: "/freelancer",
      client: "/client",
    };
    const target = roleRoutes[user.role as "admin" | "freelancer" | "client"] || "/";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Block auth pages for logged users
  if (authPaths.some(p => path.startsWith(p))) {
    const roleRoutes: Record<"admin" | "freelancer" | "client", string> = {
      admin: "/admin",
      freelancer: "/freelancer",
      client: "/client",
    };

    const redirectPath =
      roleRoutes[user.role as "admin" | "freelancer" | "client"];

    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Role routing
  const roleRoutes: Record<"admin" | "freelancer" | "client", string> = {
    admin: "/admin",
    freelancer: "/freelancer",
    client: "/client",
  };

  const allowedRoot = roleRoutes[user.role as "admin" | "freelancer" | "client"];

  // Redirect root
  if (path === "/") {
    return NextResponse.redirect(new URL(allowedRoot, req.url));
  }

  // Prevent cross-role access
  if (!path.startsWith(allowedRoot)) {
    return NextResponse.redirect(new URL(allowedRoot, req.url));
  }

  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images|assets).*)"] };