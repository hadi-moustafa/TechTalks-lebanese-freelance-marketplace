"use client"

import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Mail, Lock, User } from "lucide-react"

export default function SignupPage() {
    return (
        <AuthCard
            title="Create an Account"
            subtitle="Join the Lebanese Freelance Marketplace today"
        >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        icon={<User className="h-4 w-4" />}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Create a password"
                        icon={<Lock className="h-4 w-4" />}
                        required
                    />
                </div>

                <Button className="w-full bg-lebanon-green hover:bg-green-700" size="lg">
                    Sign Up
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
                    <Button variant="social" className="w-full">
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Google
                    </Button>
                    <Button variant="social" className="w-full bg-[#1877F2] text-white hover:bg-[#1559b3] border-transparent">
                        <svg className="mr-2 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.606-2.797 4.16v1.912h4.141l-.542 3.667h-3.599v7.98c-1.644.595-3.376.591-5.019 0z" />
                        </svg>
                        Facebook
                    </Button>
                </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-lebanon-red hover:underline">
                    Login
                </Link>
            </p>
        </AuthCard>
    )
}
