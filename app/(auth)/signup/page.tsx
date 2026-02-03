"use client"

import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Mail, Lock, User, CheckCircle, ArrowRight } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/app/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    })
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setStep(2)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyAndSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // 1. Call custom signup API (Verifies OTP + Creates Confirmed User)
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    otp
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // 2. User created and confirmed. Now log them in.
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            })

            if (signInError) throw signInError

            // 3. Redirect to onboarding
            router.push('/onboarding')

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard
            title={step === 1 ? "Create an Account" : "Verify Email"}
            subtitle={step === 1 ? "Join the Lebanese Freelance Marketplace today" : `Enter the code sent to ${formData.email}`}
        >
            {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

            {step === 1 ? (
                <form className="space-y-6" onSubmit={handleSendOTP}>
                    <div className="space-y-4">
                        <Input
                            label="Username"
                            name="username"
                            type="text"
                            placeholder="johndoe123"
                            icon={<User className="h-4 w-4" />}
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            icon={<Mail className="h-4 w-4" />}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            icon={<Lock className="h-4 w-4" />}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full bg-lebanon-green hover:bg-green-700" size="lg" disabled={loading}>
                        {loading ? 'Sending Code...' : 'Continue'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <Button variant="social" className="w-full" type="button" onClick={() => {
                            supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${location.origin}/auth/callback?next=/onboarding`,
                                },
                            })
                        }}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>
                    </div>
                </form>
            ) : (
                <form className="space-y-6" onSubmit={handleVerifyAndSignup}>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-lebanon-green" />
                            </div>
                            <p className="text-sm text-gray-600">We sent a verification code to <strong>{formData.email}</strong></p>
                        </div>

                        <Input
                            label="Verification Code"
                            name="otp"
                            type="text"
                            placeholder="123456"
                            icon={<CheckCircle className="h-4 w-4" />}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full bg-lebanon-green hover:bg-green-700" size="lg" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Verify & Create Account'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-sm text-gray-500 hover:text-gray-900 mt-4"
                    >
                        Back to details
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="text-xs text-lebanon-green hover:underline disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-lebanon-red hover:underline">
                    Login
                </Link>
            </p>
        </AuthCard>
    )
}
