import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

// ---------------------------------------------
// Transporter (Gmail u otro SMTP)
// ---------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
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
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:auto;">
      <h2 style="color:#2563eb;">Welcome${firstName ? `, ${firstName}` : ""}!</h2>
      <p>Thanks for signing up with <b>Charterly</b>. Please confirm your email address to activate your account.</p>
      <div style="text-align:center; margin:30px 0;">
        <a href="${verificationUrl}" target="_blank"
          style="background:#2563eb;color:#fff;padding:14px 28px;text-decoration:none;
                 border-radius:6px;font-weight:600;display:inline-block;font-size:16px;">
          Verify My Email
        </a>
      </div>
      <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;"><a href="${verificationUrl}" target="_blank">${verificationUrl}</a></p>
      <p style="font-size:12px;color:#666;margin-top:24px;">
        This link will expire in 1 hour for your security.
      </p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string,
  role?: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  const redirectUrl =
    role === "captain"
      ? `${baseUrl}/captain/onboarding`
      : `${baseUrl}/dashboard`;

  const subject = "Welcome to Charterly 🎉";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:auto;">
      <h2 style="color:#2563eb;">Great job${firstName ? `, ${firstName}` : ""}!</h2>
      <p>Your email has been successfully verified. You can now access your account and start exploring Charterly.</p>
      <div style="text-align:center; margin:30px 0;">
        <a href="${redirectUrl}" target="_blank"
          style="background:#16a34a;color:#fff;padding:14px 28px;text-decoration:none;
                 border-radius:6px;font-weight:600;display:inline-block;font-size:16px;">
          ${role === "captain" ? "Start Onboarding" : "Go to Dashboard"}
        </a>
      </div>
      <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;"><a href="${redirectUrl}" target="_blank">${redirectUrl}</a></p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}
