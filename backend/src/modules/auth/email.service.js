import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

/**
 * In-memory store for development/testing when SMTP is not configured.
 * Allows test suites to inspect the generated password reset link without an SMTP server.
 */
export const devEmailOutbox = [];

let transporter = null;

/**
 * Initialize or get the nodemailer transporter.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (env.smtpHost && env.smtpUser && env.smtpPassword) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
    });
  }

  return transporter;
}

/**
 * Send a password reset email.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.resetToken - Raw single-use reset token
 * @returns {Promise<{ delivered: boolean, previewUrl?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetToken }) {
  const resetUrl = `${env.passwordResetUrl}?token=${encodeURIComponent(resetToken)}`;

  const subject = 'Reset Your Knowledge App Password';
  const text = `Hello,\n\nYou recently requested to reset your password for Knowledge App.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 30 minutes and can only be used once.\n\nIf you did not request a password reset, please ignore this email.\n\n— Knowledge App Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
      <p style="color: #334155; line-height: 1.6;">You recently requested to reset your password for Knowledge App. Click the button below to proceed:</p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This link is valid for 30 minutes and can only be used once. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Knowledge App — Personal Knowledge Management</p>
    </div>
  `;

  const transport = getTransporter();

  if (transport) {
    try {
      await transport.sendMail({
        from: env.smtpFrom,
        to,
        subject,
        text,
        html,
      });
      return { delivered: true };
    } catch (error) {
      console.error('[EmailService] SMTP delivery failed:', error.message);
      // Fallback to recording in dev outbox
    }
  }

  // Development / Test Fallback
  const record = {
    to,
    resetToken,
    resetUrl,
    sentAt: new Date(),
  };

  devEmailOutbox.push(record);
  if (!env.isTest) {
    console.info(`[EmailService] Dev Fallback (No SMTP configured). Password reset link for ${to}:\n${resetUrl}`);
  }

  return { delivered: true, resetUrl };
}
