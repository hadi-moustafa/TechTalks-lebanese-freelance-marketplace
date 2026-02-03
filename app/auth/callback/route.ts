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
                const { data: userByEmail } = await supabase
                    .from('users')
                    .select('*')
                    .ilike('email', user.email)
                    .single();

                if (userByEmail) {
                    existingUser = userByEmail;
                    // Optional: If we found them by email but IDs differ, we might want to update the ID? 
                    // Supabase Auth ID cannot be easily changed in public table if it's a PK.
                    // Assuming 'users.id' is a FK to auth.users.id.
                    // If they are different, it means the public.users row is "orphaned" or from a different auth provider.
                    // We should ideally update the ID to match the new Auth ID if possible, OR just trust the role.
                    // For LFM, let's assume valid linking if email matches.
                }
            }

            if (!existingUser) {
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
                    role: null
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
