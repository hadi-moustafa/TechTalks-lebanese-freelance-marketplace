import { supabase } from '@/lib/supabase';

interface PasswordChangeResult {
  success: boolean;
  error?: string;
  verificationRequired?: boolean;
}

interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

class PasswordService {
  // Store verification codes temporarily (in production, use Redis or database)
  private verificationCodes: Map<string, { code: string; expiresAt: number; newPassword: string }> = new Map();

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Initiate password change (requires current password)
   * PLAIN TEXT VERSION - FOR TESTING ONLY
   */
  async initiatePasswordChange(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<PasswordChangeResult & { verificationCode?: string; email?: string; username?: string }> {
    try {
      // Validate new password
      const validation = this.validatePassword(newPassword);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, username, password_hash')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return {
          success: false,
          error: 'User not found',
        };
      }

      // PLAIN TEXT: Direct comparison (no bcrypt)
      console.log('🔍 Checking password...');
      console.log('Entered password:', currentPassword);
      console.log('Stored password:', user.password_hash);
      
      if (currentPassword !== user.password_hash) {
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Check if new password is same as current
      if (newPassword === user.password_hash) {
        return {
          success: false,
          error: 'New password must be different from current password',
        };
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // PLAIN TEXT: Store new password as-is (no hashing)
      this.verificationCodes.set(userId, {
        code: verificationCode,
        expiresAt,
        newPassword: newPassword, // Plain text for testing
      });

      console.log(`✅ Verification code generated for user ${userId}: ${verificationCode}`);

      return {
        success: true,
        verificationRequired: true,
        verificationCode,
        email: user.email,
        username: user.username,
      };
    } catch (error: any) {
      console.error('Password change initiation error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Verify code and complete password change
   */
  async verifyAndChangePassword(userId: string, code: string): Promise<VerifyCodeResult> {
    try {
      // Get stored verification data
      const storedData = this.verificationCodes.get(userId);

      if (!storedData) {
        return {
          success: false,
          error: 'No verification code found. Please request a new password change.',
        };
      }

      // Check if code expired
      if (Date.now() > storedData.expiresAt) {
        this.verificationCodes.delete(userId);
        return {
          success: false,
          error: 'Verification code has expired. Please request a new password change.',
        };
      }

      // Verify code
      if (storedData.code !== code) {
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }

      // Update password in database (plain text)
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: storedData.newPassword })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return {
          success: false,
          error: 'Failed to update password',
        };
      }

      // Clear verification code
      this.verificationCodes.delete(userId);

      console.log(`✅ Password changed successfully for user ${userId}`);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Password verification error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Validate password format
   */
  private validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 100) {
      return { valid: false, error: 'Password must be less than 100 characters' };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }

    return { valid: true };
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data.role;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }
}

export default new PasswordService();

// import { supabase } from '@/lib/supabase';
// import bcrypt from 'bcryptjs';

// interface PasswordChangeResult {
//   success: boolean;
//   error?: string;
//   verificationRequired?: boolean;
// }

// interface VerifyCodeResult {
//   success: boolean;
//   error?: string;
// }

// class PasswordService {
//   // Store verification codes temporarily (in production, use Redis or database)
//   private verificationCodes: Map<string, { code: string; expiresAt: number; newPassword: string }> = new Map();

//   /**
//    * Generate a 6-digit verification code
//    */
//   generateVerificationCode(): string {
//     return Math.floor(100000 + Math.random() * 900000).toString();
//   }

//   /**
//    * Initiate password change (requires current password)
//    */
//   async initiatePasswordChange(
//     userId: string,
//     currentPassword: string,
//     newPassword: string
//   ): Promise<PasswordChangeResult & { verificationCode?: string; email?: string; username?: string }> {
//     try {
//       // Validate new password
//       const validation = this.validatePassword(newPassword);
//       if (!validation.valid) {
//         return {
//           success: false,
//           error: validation.error,
//         };
//       }

//       // Get user data
//       const { data: user, error: userError } = await supabase
//         .from('users')
//         .select('id, email, username, password_hash')
//         .eq('id', userId)
//         .single();

//       if (userError || !user) {
//         console.error('Error fetching user:', userError);
//         return {
//           success: false,
//           error: 'User not found',
//         };
//       }

//       // Verify current password
//       const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
//       if (!isPasswordValid) {
//         return {
//           success: false,
//           error: 'Current password is incorrect',
//         };
//       }

//       // Check if new password is same as current
//       const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
//       if (isSamePassword) {
//         return {
//           success: false,
//           error: 'New password must be different from current password',
//         };
//       }

//       // Generate verification code
//       const verificationCode = this.generateVerificationCode();
//       const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

//       // Hash the new password
//       const hashedPassword = await bcrypt.hash(newPassword, 10);

//       // Store verification code
//       this.verificationCodes.set(userId, {
//         code: verificationCode,
//         expiresAt,
//         newPassword: hashedPassword,
//       });

//       console.log(`✅ Verification code generated for user ${userId}: ${verificationCode}`);

//       return {
//         success: true,
//         verificationRequired: true,
//         verificationCode,
//         email: user.email,
//         username: user.username,
//       };
//     } catch (error: any) {
//       console.error('Password change initiation error:', error);
//       return {
//         success: false,
//         error: error.message || 'An unexpected error occurred',
//       };
//     }
//   }

//   /**
//    * Verify code and complete password change
//    */
//   async verifyAndChangePassword(userId: string, code: string): Promise<VerifyCodeResult> {
//     try {
//       // Get stored verification data
//       const storedData = this.verificationCodes.get(userId);

//       if (!storedData) {
//         return {
//           success: false,
//           error: 'No verification code found. Please request a new password change.',
//         };
//       }

//       // Check if code expired
//       if (Date.now() > storedData.expiresAt) {
//         this.verificationCodes.delete(userId);
//         return {
//           success: false,
//           error: 'Verification code has expired. Please request a new password change.',
//         };
//       }

//       // Verify code
//       if (storedData.code !== code) {
//         return {
//           success: false,
//           error: 'Invalid verification code',
//         };
//       }

//       // Update password in database
//       const { error: updateError } = await supabase
//         .from('users')
//         .update({ password_hash: storedData.newPassword })
//         .eq('id', userId);

//       if (updateError) {
//         console.error('Error updating password:', updateError);
//         return {
//           success: false,
//           error: 'Failed to update password',
//         };
//       }

//       // Clear verification code
//       this.verificationCodes.delete(userId);

//       console.log(`✅ Password changed successfully for user ${userId}`);

//       return {
//         success: true,
//       };
//     } catch (error: any) {
//       console.error('Password verification error:', error);
//       return {
//         success: false,
//         error: error.message || 'An unexpected error occurred',
//       };
//     }
//   }

//   /**
//    * Validate password format
//    */
//   private validatePassword(password: string): { valid: boolean; error?: string } {
//     if (password.length < 8) {
//       return { valid: false, error: 'Password must be at least 8 characters' };
//     }

//     if (password.length > 100) {
//       return { valid: false, error: 'Password must be less than 100 characters' };
//     }

//     // Check for at least one uppercase letter
//     if (!/[A-Z]/.test(password)) {
//       return { valid: false, error: 'Password must contain at least one uppercase letter' };
//     }

//     // Check for at least one lowercase letter
//     if (!/[a-z]/.test(password)) {
//       return { valid: false, error: 'Password must contain at least one lowercase letter' };
//     }

//     // Check for at least one number
//     if (!/[0-9]/.test(password)) {
//       return { valid: false, error: 'Password must contain at least one number' };
//     }

//     // Check for at least one special character
//     if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
//       return { valid: false, error: 'Password must contain at least one special character' };
//     }

//     return { valid: true };
//   }

//   /**
//    * Get user role
//    */
//   async getUserRole(userId: string): Promise<string | null> {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('role')
//         .eq('id', userId)
//         .single();

//       if (error || !data) {
//         console.error('Error fetching user role:', error);
//         return null;
//       }

//       return data.role;
//     } catch (error) {
//       console.error('Error in getUserRole:', error);
//       return null;
//     }
//   }
// }

// export default new PasswordService();