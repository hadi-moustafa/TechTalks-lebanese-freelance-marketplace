'use client'

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/app/supabase/client"

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get('next') ?? '/onboarding'
    const [status, setStatus] = useState("Authenticating...")

    useEffect(() => {
        const handleCallback = async () => {
            // 1. Check for session (Supabase handles hash/code auto-magically)
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                setStatus("Authentication failed: " + error.message)
                return
            }

            if (session) {
                setStatus("Syncing profile...")
                // 2. Sync profile to public.users
                try {
                    const res = await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    })
                    if (!res.ok) {
                        console.error("Sync failed")
                        // Proceed anyway, onboarding might fix it or fail there
                    }
                } catch (err) {
                    console.error("Sync error:", err)
                }

                // 3. fetch role to determine redirect
                let redirectUrl = next
                try {
                    const { data: userRecord, error: roleError } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (!roleError && userRecord) {
                        const role = userRecord.role?.toLowerCase();
                        if (role === 'client') redirectUrl = '/client'
                        else if (role === 'freelancer') redirectUrl = '/freelancer'
                        else if (role === 'admin') redirectUrl = '/admin'
                        else if (!role) redirectUrl = '/onboarding'
                    }
                } catch (e) {
                    console.error("Role check failed", e)
                }

                // 4. Redirect
                router.push(redirectUrl)
            } else {
                // Fallback for code flow if not handled
                const code = searchParams.get('code')
                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    if (exchangeError) {
                        setStatus("Exchange failed: " + exchangeError.message)
                        return
                    }
                    window.location.reload()
                    return
                }
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                handleCallback()
            }
        })

        // Initial check
        handleCallback()

        return () => {
            subscription.unsubscribe()
        }
    }, [next, router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lebanon-green mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">{status}</h2>
                <p className="text-gray-500 mt-2">Please wait while we set up your account...</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lebanon-green mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
