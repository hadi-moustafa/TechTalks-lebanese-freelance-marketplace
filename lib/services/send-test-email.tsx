'use client'

import { useState } from 'react'
import { emailService } from './email'

export default function SendTestEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const sendTestEmail = async () => {
    if (!email) {
      setMessage('Please enter an email address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const success = await emailService.sendOTPEmail(email, otp)
      
      if (success) {
        setMessage(`Test OTP email sent to ${email} with code: ${otp}`)
        setEmail('')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Test Email Service</h3>
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter test email"
          className="w-full px-3 py-2 border rounded-md"
        />
        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
        {message && (
          <p className="text-sm p-2 bg-gray-50 rounded">{message}</p>
        )}
      </div>
    </div>
  )
}