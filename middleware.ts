import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Public routes (no auth required)
  const publicPaths = ["/login", "/signup", "/auth", "/auth/callback"];

  if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return res;
  }

  // Supabase SSR client
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

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Block unauthenticated users (except in dev)
  if (!session) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  // Fetch role from DB
  const { data: user } = await supabase
    .from("users")
    .select("role, is_suspended")
    .eq("id", session?.user?.id)
    .single();

  // Safety check
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Suspended user block
  if (user.is_suspended) {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  const path = req.nextUrl.pathname;

  // RBAC routing
  const roleRedirectMap: Record<string, string> = {
    admin: "/admin",
    freelancer: "/freelancer",
    client: "/client",
  };

  const redirectPath = roleRedirectMap[user.role];

  if (redirectPath && !path.startsWith(redirectPath)) {
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return res;
}

// Ignore static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
};
