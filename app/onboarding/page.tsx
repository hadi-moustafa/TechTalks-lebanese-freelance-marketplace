"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/supabase/client"
import { Button } from "@/components/ui/Button"
import { Briefcase, User, CheckCircle } from "lucide-react"
import { AuthCard } from "@/components/auth/AuthCard"
import toast from "react-hot-toast"

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | null>(null)

    const handleRoleSelection = (role: 'client' | 'freelancer') => {
        setSelectedRole(role)
    }

    const handleContinue = async () => {
        if (!selectedRole) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("User not authenticated")
                router.push('/login')
                return
            }

            // Update role in public.users
            const { error } = await supabase
                .from('users')
                .update({ role: selectedRole })
                .eq('id', user.id)

            if (error) throw error

            toast.success(`Welcome, ${selectedRole}!`)

            // Redirect to appropriate dashboard
            if (selectedRole === 'client') {
                router.push('/client')
            } else {
                router.push('/freelancer')
            }

        } catch (error: any) {
            console.error('Error updating role:', error)
            toast.error("Failed to update role. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthCard
            title="Select Your Role"
            subtitle="How do you plan to use LFM?"
            className="max-w-4xl" // Wider card for the two options
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                {/* Client Card */}
                <div
                    className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-md ${selectedRole === 'client'
                            ? 'border-lebanon-green bg-green-50 ring-1 ring-lebanon-green'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    onClick={() => handleRoleSelection('client')}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full transition-colors ${selectedRole === 'client' ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Briefcase className={`h-8 w-8 ${selectedRole === 'client' ? 'text-lebanon-green' : 'text-gray-500'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Client</h3>
                            <p className="text-sm text-gray-500 mt-1">I want to hire freelancers</p>
                        </div>
                        {selectedRole === 'client' && (
                            <div className="absolute top-3 right-3 text-lebanon-green animate-in zoom-in duration-200">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Freelancer Card */}
                <div
                    className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-md ${selectedRole === 'freelancer'
                            ? 'border-lebanon-red bg-red-50 ring-1 ring-lebanon-red'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    onClick={() => handleRoleSelection('freelancer')}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full transition-colors ${selectedRole === 'freelancer' ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <User className={`h-8 w-8 ${selectedRole === 'freelancer' ? 'text-lebanon-red' : 'text-gray-500'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Freelancer</h3>
                            <p className="text-sm text-gray-500 mt-1">I want to offer services</p>
                        </div>
                        {selectedRole === 'freelancer' && (
                            <div className="absolute top-3 right-3 text-lebanon-red animate-in zoom-in duration-200">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <Button
                    size="lg"
                    className="w-full bg-lebanon-green hover:bg-green-700 font-semibold"
                    disabled={!selectedRole || loading}
                    onClick={handleContinue}
                    loading={loading}
                >
                    {loading ? 'Setting up Profile...' : 'Continue'}
                </Button>
            </div>
        </AuthCard>
    )
}
