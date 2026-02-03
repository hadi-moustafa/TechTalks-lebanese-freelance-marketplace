import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: isValid, error } = await supabase.rpc('verify_otp', {
            p_email: email,
            p_code: otp
        });

        if (error) {
            console.error("Supabase RPC Error:", error);
            return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
        }

        if (!isValid) {
            return NextResponse.json({ valid: false, message: 'Invalid or expired OTP' }, { status: 400 });
        }

        return NextResponse.json({ valid: true, message: 'OTP verified successfully' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
