export interface User {
  id: string
  email: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface OTPVerification {
  id: string
  user_id: string
  otp_code: string
  expires_at: string
  is_used: boolean
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface OTPVerificationRequest {
  userId: string
  otpCode: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}