import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/supabase/client';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password, username, otp } = await req.json();

        if (!email || !password || !username || !otp) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // 1. Verify OTP using Anon Client (RPC)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase Env keys");
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: isValid, error: otpError } = await supabase.rpc('verify_otp', {
            p_email: email,
            p_code: otp
        });

        if (otpError) {
            console.error("Supabase RPC Error:", otpError);
            return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }

        // Hash password for public record sync
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create User using Admin Client (Auto-confirm email)
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("FATAL: Missing SUPABASE_SERVICE_ROLE_KEY in environment");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Role Key' }, { status: 500 });
        }

        const admin = supabaseAdmin();
        const { data: user, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                username: username
            }
        });

        if (createError) {
            // If user already exists, attempt to find and update/confirm them
            if (createError.message === 'User already registered' || createError.status === 422 || (createError as any).code === 'email_exists') {

                // Scan users to find ID (since admin API doesn't support getByEmail directly easily without filtering which might be limited)
                // Note: Ideally use a backend lookup table, but for now scan listUsers.
                const { data: { users: allUsers }, error: searchError } = await admin.auth.admin.listUsers();
                if (searchError) throw searchError;

                const existingUser = allUsers.find(u => u.email === email);

                if (existingUser) {
                    // Confirm them and update password
                    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
                        email_confirm: true,
                        password: password,
                        user_metadata: { username: username }
                    });

                    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

                    // Ensure public user record exists
                    const { error: publicInsertError } = await admin
                        .from('users')
                        .upsert({
                            id: existingUser.id,
                            email: email,
                            username: username,
                            password_hash: hashedPassword, // Added field
                            // role is left null/current for onboarding to set
                        }, { onConflict: 'id' });

                    if (publicInsertError) {
                        console.error("Error syncing public user:", publicInsertError);
                    }

                    return NextResponse.json({ success: true, message: 'Account confirmed and updated' });
                }
            }

            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        // Insert into public table for new user
        if (user && user.user) {
            const { error: publicInsertError } = await admin
                .from('users')
                .insert({
                    id: user.user.id,
                    email: email,
                    username: username,
                    password_hash: hashedPassword, // Added field
                    role: null
                });

            if (publicInsertError) {
                console.error("Error creating public user:", publicInsertError);
                // We should probably fail or log?
                // If this fails, onboarding will fail.
                return NextResponse.json({ error: "Failed to create user profile: " + publicInsertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: 'Account created successfully' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
