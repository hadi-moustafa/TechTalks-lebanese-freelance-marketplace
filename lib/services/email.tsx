'use server'

import nodemailer from 'nodemailer'

interface SendOTPParams {
  email: string
  otp: string
  userName?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // <--- Add this line
  },
});

export async function sendVerificationEmail(email: string, code: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div>
          <h1>Verification Code</h1>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
}
export async function sendOTPEmail({ email, otp, userName }: SendOTPParams) {
  try {
    console.log(`📧 Attempting to send OTP to: ${email}`)
    
    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP credentials not configured in .env.local')
      console.log(`Please add your Gmail credentials to .env.local file`)
      console.log(`🔐 OTP for ${email}: ${otp}`)
      return { 
        success: false, 
        error: 'Email service not configured. Check .env.local file.',
        otp: otp 
      }
    }


    // Send the email
    const info = await transporter.sendMail({
      from: `"Lebanese Marketplace" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Login OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007a3d; color: white; padding: 20px; text-align: center;">
            <h1>Lebanese Freelance Marketplace</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Hello ${userName || 'User'},</h2>
            <p>Your One-Time Password (OTP) for login verification is:</p>
            <div style="background: white; border: 2px dashed #007a3d; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #007a3d;">${otp}</div>
              <p style="color: #666; margin-top: 10px;">Expires in 10 minutes</p>
            </div>
            <p>Enter this code on the login page to complete your verification.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <br>
            <p>Best regards,<br>
            <strong>The Lebanese Marketplace Team</strong></p>
          </div>
          <div style="background: #f1f1f1; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Lebanese Freelance Marketplace</p>
          </div>
        </div>
      `,
      text: `
        Lebanese Freelance Marketplace - OTP Code
        
        Hello ${userName || 'User'},
        
        Your One-Time Password (OTP) for login verification is:
        
        ${otp}
        
        This code expires in 10 minutes.
        
        Enter this code on the login page to complete your verification.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        The Lebanese Marketplace Team
      `
    })

    console.log('✅ Email sent successfully!')
    console.log(`📧 To: ${email}`)
    console.log(`🔐 OTP: ${otp}`)
    console.log(`💌 Check ${email} inbox for the OTP email`)
    
    return { 
      success: true, 
      error: null,
      messageId: info.messageId
    }
    
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message)
    
    // Show OTP in console as backup
    console.log(`🔐 BACKUP OTP for ${email}: ${otp}`)
    console.log(`⚠️ Email failed. Use this OTP: ${otp}`)
    
    return { 
      success: false, 
      error: error.message,
      otp: otp 
    }
  }
}