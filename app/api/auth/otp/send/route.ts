import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/services/emailService';
import otpGenerator from 'otp-generator';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Generate 6 digit numeric OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Initialize Supabase Client (Service Role needed if RPC was protected, but we granted access to anon)
        // Actually, for security, using service role here is better if we restricted RPC, 
        // but since we granted anon, we can use standard client or just a fresh one.
        // However, `request_otp` is security definer, so it runs with owner privileges.
        // We can use the anon client.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.rpc('request_otp', {
            p_email: email,
            p_code: otp
        });

        if (error) {
            console.error("Supabase RPC Error:", error);
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // Send Email
        const emailResult = await sendEmail(
            email,
            'Your LFM Verification Code',
            `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`
        );

        if (!emailResult.success) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
