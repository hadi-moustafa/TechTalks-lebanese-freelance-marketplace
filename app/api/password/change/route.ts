import { NextRequest, NextResponse } from 'next/server';
import PasswordService from '@/services/passwordService';
import EmailService from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initiate password change
    const result = await PasswordService.initiatePasswordChange(
      userId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Send verification email
    if (result.verificationCode && result.email && result.username) {
      const emailResult = await EmailService.sendPasswordChangeVerification(
        result.email,
        result.username,
        result.verificationCode
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to send verification email. Please try again.',
          },
          { status: 500 }
        );
      }

      console.log('✅ Verification email sent to:', result.email);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      verificationRequired: true,
    });
  } catch (error: any) {
    console.error('Password change API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}