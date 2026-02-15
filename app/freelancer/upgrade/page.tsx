'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/CheckoutForm';
import { Check, Star, Shield, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function UpgradePage() {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'pro'>('pro'); // Expandable for more plans

    const PLAN_PRICE = 20;

    useEffect(() => {
        // Create PaymentIntent as soon as the page loads (or when plan is selected)
        const createIntent = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Handle unauthenticated state (redirect or show login)
                return;
            }

            try {
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

                if (!res.ok) {
                    const text = await res.text();
                    console.error('API Error:', res.status, text);
                    // Handle error state in UI
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                setClientSecret(data.clientSecret);
            } catch (err) {
                console.error('Error creating payment intent:', err);
            } finally {
                setLoading(false);
            }
        };

        createIntent();
    }, []);

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#00A650',
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link href="/freelancer" className="text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Upgrade to Pro</h1>
                </div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Plan Details */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-lebanon-green to-emerald-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="text-yellow-400 fill-yellow-400" size={24} />
                                <span className="font-bold tracking-wide uppercase text-emerald-100 text-sm">Most Popular</span>
                            </div>
                            <h2 className="text-4xl font-extrabold mb-4">Pro Plan</h2>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-bold">$20</span>
                                <span className="text-emerald-100">/month</span>
                            </div>
                            <p className="text-emerald-100 text-lg leading-relaxed">
                                Supercharge your freelancing career with exclusive tools and higher visibility.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">What's included:</h3>
                        <ul className="space-y-4">
                            {[
                                'Zero Commission Fees on first 5 jobs',
                                'Priority Support 24/7',
                                'Verified Pro Badge on Profile',
                                'Advanced Analytics Dashboard',
                                'Unlimited Service Postings'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-green-100 flex items-center justify-center text-lebanon-green">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Checkout Section */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-lg">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Secure Checkout</h3>
                        <p className="text-gray-500 text-sm">Complete your payment to activate Pro features instantly.</p>
                    </div>

                    {clientSecret && stripePromise ? (
                        // @ts-ignore
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm amount={PLAN_PRICE} />
                        </Elements>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-lebanon-green" size={40} />
                            <p className="text-gray-500 text-sm">Initializing secure payment...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
