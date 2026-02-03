'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster } from 'react-hot-toast'
import { Mail, Lock, RefreshCw, MailCheck } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/app/supabase/client'
import { loginAction, verifyOTPAction, resendOTPAction } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const result = await loginAction(formData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      if (result.success && result.redirectTo) {
        toast.success('Login successful!')
        // Redirect
        router.push(result.redirectTo)
      } else if (result.requiresOTP) {
        setOtpSent(true)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('otp', otp)

    try {
      const result = await verifyOTPAction(formData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)

      // Redirect to onboarding page
      if (result.redirectTo) {
        setTimeout(() => {
          router.push(result.redirectTo!)
        }, 1000)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await resendOTPAction(formData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)

      if (result.otp) {
        console.log(`🔐 NEW OTP for ${email}: ${result.otp}`)
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  if (otpSent) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
                <p className="text-gray-600">Enter the OTP sent to your email</p>
                <p className="text-sm text-gray-500 mt-2">Sending to: {email}</p>
              </div>

              <form className="space-y-6" onSubmit={handleOTPSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Check your email for the 6-digit code
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  loading={loading}
                  disabled={otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </form>

              <div className="mt-6 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 border border-gray-300"
                  disabled={loading}
                >
                  Back to Login
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || loading}
                  className="flex-1 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 border border-blue-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      >
        <form className="space-y-6" onSubmit={handleLoginSubmit}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name="email"
            />
            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
              />
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
            loading={loading}
          >
            Login
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            variant="social"
            className="w-full"
            type="button"
            onClick={() => {
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${location.origin}/auth/callback`,
                },
              })
            }}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-red-600 hover:underline">
            Sign up
          </Link>
        </p>
      </AuthCard>
    </>
  )
}