import { supabase } from '@/lib/supabase'

interface UsernameUpdateResult {
  success: boolean
  error?: string
  username?: string
}

class UsernameService {
  /**
   * Update username for a user
   * @param userId - The user's UUID
   * @param newUsername - The new username to set
   * @returns Result object with success status
   */
  async updateUsername(userId: string, newUsername: string): Promise<UsernameUpdateResult> {
    try {
      // Validate username
      const validation = this.validateUsername(newUsername)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername)
        .neq('id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Error checking username availability:', checkError)
        return {
          success: false,
          error: 'Failed to verify username availability'
        }
      }

      if (existingUser) {
        return {
          success: false,
          error: 'Username is already taken'
        }
      }

      // Update username in database
      const { data, error } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', userId)
        .select('username')
        .single()

      if (error) {
        console.error('Error updating username:', error)
        return {
          success: false,
          error: 'Failed to update username'
        }
      }

      return {
        success: true,
        username: data.username
      }
    } catch (err: any) {
      console.error('Unexpected error updating username:', err)
      return {
        success: false,
        error: err.message || 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get current username for a user
   * @param userId - The user's UUID
   * @returns Current username or null
   */
  async getUsername(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()

      if (error) {
        // If row not found (PGRST116), just return null without error
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching username:', error)
        return null
      }

      return data?.username || null
    } catch (err) {
      console.error('Unexpected error fetching username:', err)
      return null
    }
  }

  /**
   * Validate username format
   * @param username - Username to validate
   * @returns Validation result
   */
  private validateUsername(username: string): { valid: boolean; error?: string } {
    // Remove whitespace
    const trimmed = username.trim()

    // Check length
    if (trimmed.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' }
    }

    if (trimmed.length > 30) {
      return { valid: false, error: 'Username must be less than 30 characters' }
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }

    // Check if starts with letter or number
    if (!/^[a-zA-Z0-9]/.test(trimmed)) {
      return { valid: false, error: 'Username must start with a letter or number' }
    }

    return { valid: true }
  }
}

export default new UsernameService()