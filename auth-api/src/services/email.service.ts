import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    })
  : null;

function buildLink(path: string, token: string): string {
  const base = env.FRONTEND_URL.replace(/\/$/, "");
  return `${base}${path}?token=${token}`;
}

async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    logger.info(`[Email] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export class EmailService {
  static async sendVerificationEmail(email: string, token: string) {
    const link = buildLink("/verify-email", token);
    await sendMail(
      email,
      "Verify your email",
      `<p>Click the link below to verify your email address:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in ${env.EMAIL_VERIFY_TOKEN_EXPIRY}.</p>`,
    );
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const link = buildLink("/reset-password", token);
    await sendMail(
      email,
      "Reset your password",
      `<p>Click the link below to reset your password:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in ${env.PASSWORD_RESET_TOKEN_EXPIRY}.</p>
       <p>If you did not request this, you can safely ignore this email.</p>`,
    );
  }

  static async sendEmailChangeConfirmation(email: string, token: string) {
    const link = buildLink("/confirm-email-change", token);
    await sendMail(
      email,
      "Confirm your new email address",
      `<p>Click the link below to confirm your new email address:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in ${env.EMAIL_VERIFY_TOKEN_EXPIRY}.</p>`,
    );
  }

  static async sendPasswordChangedNotification(email: string) {
    await sendMail(
      email,
      "Your password has been changed",
      `<p>Your password has been successfully changed.</p>
       <p>If you did not perform this action, please contact support immediately.</p>`,
    );
  }

  static async sendEmailChangedNotification(
    oldEmail: string,
    newEmail: string,
  ) {
    await sendMail(
      oldEmail,
      "Your email address has been changed",
      `<p>Your email address has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
       <p>If you did not perform this action, please contact support immediately.</p>`,
    );
  }
}
