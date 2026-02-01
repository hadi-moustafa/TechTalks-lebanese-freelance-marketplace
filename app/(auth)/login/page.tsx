"use client"

import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Mail, Lock } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {

    // ✅ added state (logic only)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // ✅ added handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
            return
        }

        // triggers middleware RBAC redirect
        window.location.href = "/"
    }

    return (
        <AuthCard
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            {/* ❗ replaced preventDefault with real handler */}
            <form className="space-y-6" onSubmit={handleLogin}>

                <div className="space-y-4">

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        required

                        // ✅ wired logic
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEmail(e.target.value)
                        }
                    />

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock className="h-4 w-4" />}
                                required

                                // ✅ wired logic
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPassword(e.target.value)
                                }
                            />

                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-lebanon-green hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                    </div>
                </div>

                <Button
                    className="w-full bg-lebanon-green hover:bg-green-700"
                    size="lg"
                >
                    Login
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="grid gap-4">
                    <Button variant="social" className="w-full">
                        <svg
                            className="mr-2 h-4 w-4"
                            aria-hidden="true"
                            focusable="false"
                            data-prefix="fab"
                            data-icon="google"
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 488 512"
                        >
                            <path
                                fill="currentColor"
                                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                            />
                        </svg>
                        Google
                    </Button>
                </div>

            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                    href="/signup"
                    className="font-semibold text-lebanon-red hover:underline"
                >
                    Sign up
                </Link>
            </p>

        </AuthCard>
    )
}
