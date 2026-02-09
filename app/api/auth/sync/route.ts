
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()

        const authHeader = req.headers.get('Authorization')
        let userUser = null

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { user }, error } = await supabase.auth.getUser(token)
            if (!error && user) {
                userUser = user
            }
        } else {
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() { return cookieStore.getAll() },
                        setAll(cookiesToSet) { /* ignore */ },
                    },
                }
            )
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (!authError && user) userUser = user
        }

        if (!userUser) {
            console.log("[Sync] Unauthorized request");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = supabaseAdmin();
        const email = userUser.email!;

        console.log(`[Sync] Checking user. ID: ${userUser.id}, Email: ${email}`);

        // 1. Check if user exists by ID
        const { data: existingUserById } = await admin
            .from('users')
            .select('*')
            .eq('id', userUser.id)
            .single();

        if (existingUserById) {
            console.log(`[Sync] Found by ID. Role: ${existingUserById.role}`);

            // Update metadata details
            await admin.from('users').update({
                username: userUser.user_metadata?.full_name || userUser.user_metadata?.name || existingUserById.username,
                profile_pic: userUser.user_metadata?.avatar_url || existingUserById.profile_pic,
                updated_at: new Date().toISOString()
            }).eq('id', userUser.id);

            return NextResponse.json({ success: true, role: existingUserById.role });
        }

        // 2. Check if user exists by Email (Case Insensitive)
        const { data: existingUserByEmail } = await admin
            .from('users')
            .select('*')
            .ilike('email', email)
            .single();

        if (existingUserByEmail) {
            console.log(`[Sync] Found by Email (${existingUserByEmail.email}). Role: ${existingUserByEmail.role}`);

            // Note: If we found them by email but NOT by ID, it means the auth ID is different (linked vs legacy).
            // Ideally we should link them. But complex.
            // For now, trust the role.
            return NextResponse.json({ success: true, role: existingUserByEmail.role });
        }

        console.log(`[Sync] User not found. Creating new record.`);

        // 3. New User - Insert
        const { error: insertError } = await admin.from('users').insert({
            id: userUser.id,
            email: email,
            username: userUser.user_metadata?.full_name || userUser.user_metadata?.name || email.split('@')[0],
            profile_pic: userUser.user_metadata?.avatar_url,
            password_hash: 'oauth_provider_placeholder',
            role: null,
            subscription_tier: 'free'
        });

        if (insertError) {
            console.error("Sync API Insert Error:", insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, role: null });

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Sync API Exception:", err);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
