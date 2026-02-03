// components/auth/OTPCard.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import {Button} from '@/components/ui/Button'

interface OTPCardProps {
  email: string
  onVerify: (otp: string) => void
  onBack: () => void
  onResend: () => void
}

export default function OTPCard({ email, onVerify, onBack, onResend }: OTPCardProps) {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    onVerify(otp)
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lebanon-green/10">
          <Mail className="h-6 w-6 text-lebanon-green" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="mt-2 text-gray-600">
          We sent a verification code to{' '}
          <span className="font-semibold">{email}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-digit code below to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
            Verification Code
          </label>
          <div className="mt-2">
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ''))
                setError('')
              }}
              placeholder="000000"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-bold tracking-widest placeholder-gray-400 focus:border-lebanon-green focus:outline-none focus:ring-2 focus:ring-lebanon-green/20"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-lebanon-green hover:bg-green-700"
          size="lg"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onResend}
            className="text-sm font-medium text-lebanon-green hover:text-green-700"
            disabled={isLoading}
          >
            Didn't receive a code? Resend
          </button>
        </div>
      </form>
    </div>
  )
}