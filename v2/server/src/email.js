import nodemailer from 'nodemailer';
import { createLogger } from './logger.js';

const log = createLogger('email');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email, name, token) {
  const url = `${process.env.APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your NabzChat account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#6c3fff;font-size:28px;margin:0;">NabzChat</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:32px;">
          <h2 style="color:#111;margin-top:0;">Verify your email</h2>
          <p style="color:#555;">Hi ${name},</p>
          <p style="color:#555;">Thanks for signing up! Click the button below to verify your email address.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${url}" style="background:#6c3fff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Verify Email</a>
          </div>
          <p style="color:#999;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Or copy this link: ${url}</p>
        </div>
      </div>
    `,
  });
  log.info({ email }, 'verification email sent');
}

export async function testSmtp() {
  await transporter.verify();
  log.info('SMTP connection verified');
}
