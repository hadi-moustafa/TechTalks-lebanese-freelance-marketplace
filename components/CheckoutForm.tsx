'use client';

import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const triggerCelebration = () => {
        // 1. Fire Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // 2. Play Sound (Lebanese Wedding Zaffe - Short Clip or specialized success sound)
        // For now using a standard cheerful success sound URL as placeholder
        // Using a short, pleasant notification sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to your payment completion page
                return_url: `${window.location.origin}/freelancer/upgrade`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message ?? 'An unexpected error occurred.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Confirm with our backend to update DB
            try {
                const response = await fetch('/api/confirm-upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                });

                if (response.ok) {
                    setPaymentSuccess(true);
                    setMessage('Payment successful! You are now a Pro! 🇱🇧');
                    triggerCelebration();
                } else {
                    setMessage('Payment successful, but failed to update account. Please contact support.');
                }
            } catch (err) {
                setMessage('Payment successful, but an error occurred updating your account.');
                console.error(err);
            }
            setIsProcessing(false);
        } else {
            setMessage('Payment status: ' + paymentIntent?.status);
            setIsProcessing(false);
        }
    };

    if (paymentSuccess) {
        return (
            <div className="text-center py-8 animate-in fade-in zoom-in">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade Successful!</h3>
                <p className="text-gray-500 mb-6">You are now a Pro member. Enjoy your new benefits!</p>
                <button
                    onClick={() => window.location.href = '/freelancer'}
                    className="bg-lebanon-green text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

            {message && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${message.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.includes('successful') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            <button
                disabled={isProcessing || !stripe || !elements}
                id="submit"
                className="w-full bg-lebanon-green text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                    </>
                ) : (
                    <>
                        <Lock size={18} />
                        Pay ${amount} Securely
                    </>
                )}
            </button>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock size={12} />
                Payments are fake but secure (Stripe Test Mode)
            </p>
        </form>
    );
}
