// src/services/emailService.ts
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

// ---------------------------------------------
// Transporter (adjust for your SMTP provider)
// ---------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // auto true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Charterly" <noreply@charterly.com>',
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error("Nodemailer email error:", error);
    return false;
  }
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------
export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------
// Email templates
// ---------------------------------------------

export async function sendEmailVerification(
  email: string,
  token: string,
  firstName?: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const subject = "Verify your email - Charterly";

  const html = `
    <h2>Welcome${firstName ? `, ${firstName}` : ""}!</h2>
    <p>Thanks for signing up with <b>Charterly</b>. Please confirm your email address to activate your account.</p>
    <p style="margin:20px 0;">
      <a href="${verificationUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">
        Verify My Email
      </a>
    </p>
    <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p style="font-size:12px;color:#666;margin-top:24px;">
      This link will expire in 1 hour for your security.
    </p>
  `;

  return await sendEmail({ to: email, subject, html });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  const dashboardUrl = `${baseUrl}/captain/dashboard`;

  const subject = "Welcome to Charterly 🎉";

  const html = `
    <h2>Great job${firstName ? `, ${firstName}` : ""}!</h2>
    <p>Your email has been successfully verified. You can now access your dashboard and start setting up your charters.</p>
    <p style="margin:20px 0;">
      <a href="${dashboardUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">
        Go to Dashboard
      </a>
    </p>
    <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
    <p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
  `;

  return await sendEmail({ to: email, subject, html });
}
