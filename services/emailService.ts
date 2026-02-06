import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validate environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // Don't crash immediately if env vars are missing, just warn, but basic init fails
      // Changed to console.warn to prevent build crash if env is missing during build
      console.warn('Missing SMTP configuration in environment variables');
    }

    // Create SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
    rejectUnauthorized: false, // <--- Add this line
  },
    });

    console.log('✅ Email service initialized with SMTP');
  }

  /**
   * Send an email
   */
  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);

      const info = await this.transporter.sendMail({
        from: `"LFM Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html), // Fallback to stripped HTML if no text provided
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(
    email: string,
    username: string,
    role: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.getPasswordChangeTemplate(username, role);

    return this.sendEmail({
      to: email,
      subject: '🔒 Your Password Has Been Changed - LFM Platform',
      html,
    });
  }

  /**
   * Send password change verification code
   */
  async sendPasswordChangeVerification(
    email: string,
    username: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.getVerificationCodeTemplate(username, verificationCode);

    return this.sendEmail({
      to: email,
      subject: '🔐 Verify Your Password Change - LFM Platform',
      html,
    });
  }

  /**
   * Password change confirmation email template
   */
  private getPasswordChangeTemplate(username: string, role: string): string {
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔒 Password Changed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Hi ${username},</h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your password has been successfully changed for your <strong>${role}</strong> account on the LFM Platform.
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Changed on:</strong> ${timestamp}
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you did not make this change, please contact our support team immediately.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Tip:</strong> Never share your password with anyone. LFM will never ask for your password via email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © 2025 LFM Platform. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Verification code email template
   */
  private getVerificationCodeTemplate(username: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Password Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔐 Verify Password Change</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Hi ${username},</h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You requested to change your password. Please use the verification code below to confirm this change:
              </p>
              
              <!-- Verification Code Box -->
              <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border: 2px dashed #8b5cf6; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <p style="margin: 0; color: #5b21b6; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                  <strong>⚠️ Important:</strong> If you didn't request this password change, please ignore this email and contact support immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © 2025 LFM Platform. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
