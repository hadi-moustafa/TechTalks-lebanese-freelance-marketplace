'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/CheckoutForm';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function UpgradePage() {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const PLAN_PRICE = 20;

    useEffect(() => {
        const createIntent = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: PLAN_PRICE,
                    currency: 'usd',
                    userId: user.id,
                    planId: 'pro_monthly'
                }),
            });

            const data = await res.json();
            setClientSecret(data.clientSecret);
            setLoading(false);
        };

        createIntent();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="bg-white border-b border-gray-200 p-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link href="/freelancer">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-semibold">Upgrade to Pro</h1>
                </div>
            </div>

            <main className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 p-6">

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
                    <p className="text-3xl font-bold mb-6">$20 / month</p>

                    <ul className="space-y-3 text-sm text-gray-600">
                        {[
                            'Lower commission fees',
                            'Priority support',
                            'Pro badge',
                            'Advanced analytics',
                            'Unlimited services'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <Check size={14} className="text-green-600" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                        Secure Checkout
                    </h3>

                    {clientSecret ? (
                        <Elements options={{ clientSecret }} stripe={stripePromise}>
                            <CheckoutForm amount={PLAN_PRICE} />
                        </Elements>
                    ) : (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}