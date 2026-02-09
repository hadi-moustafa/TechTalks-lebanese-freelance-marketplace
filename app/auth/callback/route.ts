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
            // 1. Check by ID first
            let { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            // 2. If not found by ID, check by Email (to link accounts or handle pre-filled data)
            if (!existingUser && user.email) {
                console.log(`[GoogleAuth] User ${user.id} not found by ID. Checking for email: ${user.email}`);
                const { data: userByEmail } = await supabase
                    .from('users')
                    .select('*')
                    .ilike('email', user.email)
                    .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple found (though should be unique)

                if (userByEmail) {
                    console.log(`[GoogleAuth] Found existing user by email: ${userByEmail.id} (Role: ${userByEmail.role})`);
                    existingUser = userByEmail;
                } else {
                    console.log(`[GoogleAuth] No user found by email.`);
                }
            } else if (existingUser) {
                console.log(`[GoogleAuth] Found existing user by ID: ${existingUser.id} (Role: ${existingUser.role})`);
            }

            if (!existingUser) {
                console.log(`[GoogleAuth] Creating NEW user public record for ${user.email}`);
                // Create public user record
                const email = user.email!;
                const username = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
                const avatar = user.user_metadata?.avatar_url;

                // Use admin client to bypass any RLS on insert if needed, though server client should have access?
                // No, standard server client is user-context (which is the new user). RLS MUST allow 'insert' for authenticated users.

                const { error: insertError } = await supabase.from('users').insert({
                    id: user.id,
                    email: email,
                    username: username,
                    profile_pic: avatar,
                    password_hash: 'oauth_provider_placeholder',
                    role: null,
                    subscription_tier: 'free'
                });

                if (insertError) {
                    console.error("Error creating user in callback:", insertError);
                    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=creation_failed`);
                }

                // Redirect to onboarding for new users
                return NextResponse.redirect(`${origin}/onboarding`);
            }

            // Existing user - redirect based on role or default to next param
            if (existingUser.role) {
                console.log(`[GoogleAuth] User has role: ${existingUser.role}. Next param is: ${next}`);
                // If next is onboarding but they have a role, send to dashboard
                if (next === '/onboarding') {
                    const roleRoutes: Record<string, string> = {
                        admin: "/admin",
                        freelancer: "/freelancer",
                        client: "/client",
                    };
                    const target = roleRoutes[existingUser.role.toLowerCase()] || '/';
                    console.log(`[GoogleAuth] Redirecting to dashboard: ${target}`);
                    return NextResponse.redirect(`${origin}${target}`);
                }
            } else {
                console.log(`[GoogleAuth] User exists but has NO ROLE. Redirecting to ${next}`);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
