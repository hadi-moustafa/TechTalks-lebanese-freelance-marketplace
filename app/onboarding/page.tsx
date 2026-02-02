"use client"

import { AuthCard } from "@/components/auth/AuthCard"
import { Button } from "@/components/ui/Button"
import { Briefcase, User } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleRoleSelection = async (role: 'freelancer' | 'client') => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("No user found. Please login again.")
                router.push("/login")
                return
            }

            // Upsert the user with the role.
            // We use upsert to handle both "update existing role-less user" and "create new user who has no record".
            // Note: We need to handle required fields. If 'email' and 'password_hash' are required, we must provide them.
            // For OAuth, password_hash is tricky if enforced by DB. We'll try to use the user's email.
            // A dummy hash might be needed if the DB enforces it and there's no trigger.

            const updates = {
                id: user.id,
                email: user.email!,
                role: role,
                // If the DB strictly requires password_hash and we are a Google user, this might fail unless we provide one.
                // Assuming 'oauth' or similar placeholder is acceptable or the DB constraint allows nulls for oauth (but schema said NOT NULL).
                // Let's try to provide a placeholder if it's missing from DB logic, but ideally the DB should handle this.
                // For now, we only send what we know. If it fails, we catch it.
                // However, 'upsert' works best if we provide all necessary fields for a NEW row.
                password_hash: "oauth_provider_placeholder", // Safe fallback for OAuth users if constraint is strict
                subscription_tier: 'free', // Default
                username: user.user_metadata?.full_name || user.email?.split('@')[0],
                profile_pic: user.user_metadata?.avatar_url
            }

            // We perform an upset (insert or update)
            const { error } = await supabase
                .from('users')
                .upsert(updates, { onConflict: 'id' })

            if (error) {
                console.error("Supabase error:", error)
                alert("Error updating role: " + error.message)
            } else {
                // Redirect to login to force RBAC re-check
                router.push("/login")
            }
        } catch (e) {
            console.error(e)
            alert("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard
            title="Choose Your Path"
            subtitle="How do you want to use LFM?"
        >
            <div className="space-y-4">
                <button
                    onClick={() => handleRoleSelection('freelancer')}
                    disabled={loading}
                    className="w-full group relative flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-lebanon-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-lebanon-green focus:ring-offset-2 disabled:opacity-50"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lebanon-green group-hover:bg-lebanon-green group-hover:text-white transition-colors">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-900">I am a Freelancer</h3>
                        <p className="mt-1 text-xs text-gray-500">
                            Create your profile, showcase your services, and start earning money.
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => handleRoleSelection('client')}
                    disabled={loading}
                    className="w-full group relative flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-900">I am a Client</h3>
                        <p className="mt-1 text-xs text-gray-500">
                            Find talent, post jobs, and get work done quickly and securely.
                        </p>
                    </div>
                </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
                You can change this later from your account settings.
            </p>
        </AuthCard>
    )
}
