import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  const authPaths = ["/login", "/signup", "/auth", "/auth/callback"];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user.is_suspended) {
    return NextResponse.redirect(new URL("/suspended", req.url));
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