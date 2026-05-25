const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const isMock = !process.env.SENDGRID_API_KEY && (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'mock');

  if (isMock) {
    console.log(`========================================`);
    console.log(`[MOCK EMAIL SENT]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Body:`);
    console.log(html);
    console.log(`========================================`);
    return { messageId: 'mock-id-12345' };
  }

  try {
    // Configure standard transporter (can fall back to Mailtrap or local settings)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@rentall.in',
      to,
      subject,
      html
    });

    return info;
  } catch (error) {
    console.error('Email dispatch error, printing backup to console:', error.message);
    console.log(`To: ${to}, Subject: ${subject}, Body: ${html}`);
    return { messageId: 'error-fallback-id' };
  }
};

module.exports = {
  sendEmail
};
