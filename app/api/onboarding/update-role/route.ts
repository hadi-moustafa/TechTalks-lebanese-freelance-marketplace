
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/app/supabase/client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role } = body;

        if (!role || (role !== 'client' && role !== 'freelancer')) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                        }
                    },
                },
            }
        )

        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[Onboarding] Updating role for user ${user.id} to ${role}`);

        // 2. Update via Admin Client
        const admin = supabaseAdmin();
        const { error: updateError } = await admin
            .from('users')
            .update({
                role: role,
                subscription_tier: 'free' // Ensure this is set for new users
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('[Onboarding] Update failed:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Onboarding] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
