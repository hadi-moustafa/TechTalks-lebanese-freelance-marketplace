import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client for browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (with service role key)
export const supabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('This should only be used on the server')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}