import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

// Initialize Supabase Admin Client to update user roles
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { paymentIntentId } = await request.json();

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 });
        }

        // 1. Verify Payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }

        const userId = paymentIntent.metadata.userId;
        const planId = paymentIntent.metadata.planId;

        if (!userId) {
            return NextResponse.json({ error: 'User ID missing in payment metadata' }, { status: 400 });
        }

        // 2. Update User in Supabase
        // We update the 'subscription_tier' and potentially the 'role' if needed.
        // Assuming 'pro' is the tier name.
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                subscription_tier: 'pro',
                // role: 'freelancer' // Role likely remains freelancer, just upgraded tier
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Supabase Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Upgrade confirmed' });

    } catch (error: any) {
        console.error('Internal Error:', error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
