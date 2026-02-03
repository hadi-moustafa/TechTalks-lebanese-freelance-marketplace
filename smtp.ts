// test-smtp.ts
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'hadimoustafa2024@gmail.com',
    pass: 'your-app-password-here', // Use App Password
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: 'hadimoustafa2024@gmail.com',
      to: 'fatimasouhan@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email',
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();