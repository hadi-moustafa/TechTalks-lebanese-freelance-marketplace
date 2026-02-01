import { NextRequest, NextResponse } from 'next/server';
import PasswordService from '@/services/passwordService';
import EmailService from '@/services/emailService';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    // Validate input
    if (!userId || !code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify code and change password
    const result = await PasswordService.verifyAndChangePassword(userId, code);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Get user data for confirmation email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, username, role')
      .eq('id', userId)
      .single();

    if (!userError && user) {
      // Send confirmation email
      const emailResult = await EmailService.sendPasswordChangeConfirmation(
        user.email,
        user.username,
        user.role
      );

      if (emailResult.success) {
        console.log('✅ Confirmation email sent to:', user.email);
      } else {
        console.error('Failed to send confirmation email:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Password verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}