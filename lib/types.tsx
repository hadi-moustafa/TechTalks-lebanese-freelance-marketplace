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

export interface Message {
  id: string
  room_id: string
  sender_id: string
  message_text: string
  is_read: boolean
  sent_at: string
}

export interface ChatRoom {
  id: string
  client_id: string
  freelancer_id: string
  service_id: string
  created_at: string
  client?: User & { username: string; profile_pic?: null | string }
  freelancer?: User & { username: string; profile_pic?: null | string }
  service?: { title: string }
  last_message?: Message
  unread_count?: number
}

export interface ServiceImage {
  id: string
  service_id: string
  image_url: string
  is_primary: boolean
  uploaded_at: string
}

export interface Service {
  id: string
  freelancer_id: string
  category_id: number
  title: string
  description: string
  price: number
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
  categories?: {
    id: number
    name: string
  }
  service_images?: ServiceImage[]
}