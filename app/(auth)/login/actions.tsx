'use server'

import { supabase } from '@/app/supabase/client'
import { cookies } from 'next/headers'
import { sendOTPEmail } from '@/lib/services/email' // Updated import

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { success: false, message: 'Email and password are required' }
    }

    // Query user from your custom users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return { success: false, message: 'Database error occurred' }
    }

    if (!users || users.length === 0) {
      return { success: false, message: 'Invalid email or password' }
    }

    const user = users[0]

    // Compare password
    if (user.password_hash !== password) {
      return { success: false, message: 'Invalid email or password' }
    }

    // Generate session
    const session = {
      id: user.id,
      email: user.email,
      role: user.role,
      userName: user.email.split('@')[0],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }

    // Store session in cookies
    const cookieStore = await cookies()
    cookieStore.set('session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    })

    // Generate OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in cookies
    const otpExpiresAt = Date.now() + 10 * 60 * 1000
    cookieStore.set('otp', JSON.stringify({
      code: otp,
      email: email,
      expiresAt: otpExpiresAt
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
    })

    // SEND OTP TO REAL EMAIL
    console.log(`🚀 SENDING OTP TO: ${email}`)
    const emailResult = await sendOTPEmail({
      email: email,
      otp: otp,
      userName: session.userName
    })

    console.log('='.repeat(50))
    console.log('EMAIL SENDING RESULT:')
    console.log(`✅ Success: ${emailResult.success}`)
    console.log(`📧 To: ${email}`)
    console.log(`🔐 OTP: ${otp}`)
    
    if (!emailResult.success) {
      console.log(`❌ Error: ${emailResult.error}`)
      console.log(`⚠️ Email failed, but OTP is: ${otp}`)
      console.log(`📧 Please check ${email} inbox or spam folder`)
    } else {
      console.log(`✅ Email sent successfully!`)
      console.log(`💌 Check ${email} for the OTP`)
    }
    console.log('='.repeat(50))

    return { 
      success: true, 
      message: emailResult.success 
        ? 'Login successful! Check your email for the OTP code.' 
        : 'Login successful! Email may be delayed. Check console for OTP.',
      otp: otp, // Always return OTP
      requiresOTP: true,
      emailSent: emailResult.success
    }

  } catch (error: any) {
    console.error('Login error:', error)
    return { success: false, message: 'An error occurred during login' }
  }
}

export async function verifyOTPAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const otp = formData.get('otp') as string

    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' }
    }

    const cookieStore = await cookies()
    const otpCookie = cookieStore.get('otp')
    
    if (!otpCookie) {
      return { success: false, message: 'OTP expired or not found' }
    }

    const otpData = JSON.parse(otpCookie.value)
    
    if (otpData.email !== email) {
      return { success: false, message: 'Invalid OTP session' }
    }

    if (Date.now() > otpData.expiresAt) {
      cookieStore.delete('otp')
      return { success: false, message: 'OTP has expired. Please request a new one.' }
    }

    if (otpData.code !== otp) {
      return { success: false, message: 'Invalid OTP. Please try again.' }
    }

    // OTP verified successfully
    cookieStore.delete('otp')
    
    // Get user role from session
    const sessionCookie = cookieStore.get('session')
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value)
      
      // Update session to mark as verified
      const updatedSession = {
        ...session,
        emailVerified: true,
        verifiedAt: Date.now()
      }
      
      cookieStore.set('session', JSON.stringify(updatedSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
      })
      
      // Redirect based on role
      if (session.role === 'admin') {
        return { 
          success: true, 
          message: 'Email verified successfully!',
          redirectTo: '/admin'
        }
      } else if (session.role === 'freelancer') {
        return { 
          success: true, 
          message: 'Email verified successfully!',
          redirectTo: '/freelancer'
        }
      } else if (session.role === 'client') {
        return { 
          success: true, 
          message: 'Email verified successfully!',
          redirectTo: '/client'
        }
      }
    }

    return { 
      success: true, 
      message: 'Email verified successfully!',
      redirectTo: '/onboarding'
    }

  } catch (error) {
    console.error('OTP verification error:', error)
    return { success: false, message: 'An error occurred during OTP verification' }
  }
}

export async function resendOTPAction(formData: FormData) {
  try {
    const email = formData.get('email') as string

    if (!email) {
      return { success: false, message: 'Email is required' }
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store new OTP in cookies
    const cookieStore = await cookies()
    const otpExpiresAt = Date.now() + 10 * 60 * 1000
    
    cookieStore.set('otp', JSON.stringify({
      code: newOtp,
      email: email,
      expiresAt: otpExpiresAt
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
    })

    // Extract username from email
    const userName = email.split('@')[0]

    // Send new OTP via email
    console.log(`🔄 RESENDING OTP TO: ${email}`)
    const emailResult = await sendOTPEmail({
      email: email,
      otp: newOtp,
      userName: userName
    })

    console.log('='.repeat(50))
    console.log('RESEND EMAIL RESULT:')
    console.log(`✅ Success: ${emailResult.success}`)
    console.log(`📧 To: ${email}`)
    console.log(`🔐 NEW OTP: ${newOtp}`)
    console.log('='.repeat(50))

    return { 
      success: true, 
      message: 'New OTP has been sent to your email.',
      otp: newOtp
    }

  } catch (error: any) {
    console.error('Resend OTP error:', error)
    return { success: false, message: 'Failed to resend OTP. Please try again.' }
  }
}