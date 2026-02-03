// test-env-email.ts
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local explicitly
dotenv.config({ 
  path: path.resolve(__dirname, '.env.local') 
});

console.log('🔍 Testing .env.local configuration:');
console.log('===================================');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS first 4 chars:', process.env.SMTP_PASS?.substring(0, 4) + '...');
console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length || 0);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('===================================\n');

// Check if credentials exist
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ ERROR: SMTP credentials not found in .env.local');
  console.error('Make sure your .env.local file has:');
  console.error('SMTP_USER=hadimoustafa2024@gmail.com');
  console.error('SMTP_PASS=your-16-char-app-password');
  process.exit(1);
}

async function testEmail(): Promise<void> {
  console.log('🚀 Testing email sending...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER?.trim() || '',
      pass: process.env.SMTP_PASS?.trim() || '',
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Test from .env.local',
      text: 'If you receive this, your .env.local settings are working!',
      html: '<h1>🎉 .env.local SMTP Works!</h1><p>Your configuration is correct!</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('\n📬 Check your inbox and spam folder!');
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔑 AUTHENTICATION FAILED!');
      console.log('Please check:');
      console.log('1. Your app password is correct');
      console.log('2. 2-Step Verification is enabled');
      console.log('3. .env.local has correct password (NO SPACES)');
      console.log('\nRegenerate app password: https://myaccount.google.com/apppasswords');
    }
  }
}

// Run the test
testEmail();