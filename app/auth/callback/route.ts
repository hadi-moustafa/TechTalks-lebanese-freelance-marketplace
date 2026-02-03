import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/onboarding";

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && user) {
            // SYNC USER TO PUBLIC TABLE
            const { data: existingUser } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!existingUser) {
                // Create public user record
                const email = user.email!;
                const username = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
                const avatar = user.user_metadata?.avatar_url;

                await supabase.from('users').insert({
                    id: user.id,
                    email: email,
                    username: username,
                    profile_pic: avatar,
                    password_hash: 'oauth_provider_placeholder',
                    role: null
                });

                // Redirect to onboarding for new users
                return NextResponse.redirect(`${origin}/onboarding`);
            }

            // Existing user - redirect based on role or default to next param
            if (existingUser.role) {
                // If next is onboarding but they have a role, send to dashboard
                if (next === '/onboarding') {
                    const roleRoutes: Record<string, string> = {
                        admin: "/admin",
                        freelancer: "/freelancer",
                        client: "/client",
                    };
                    return NextResponse.redirect(`${origin}${roleRoutes[existingUser.role] || '/'}`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
