import crypto from "crypto";
import nodemailer from "nodemailer";
import { logger } from "./logger";

import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Deliver a password-reset OTP. Local development keeps the code in the
 * application log; production sends it through SMTP when configured.
 */
export async function deliverPasswordResetOtp(email: string, otp: string): Promise<boolean> {
  const mailer = getTransporter();

  if (!mailer) {
    logger.info(`[password-reset] OTP for ${email}: ${otp} (valid 10 minutes)`);
    return false;
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your Sisters Kitchen verification code",
    text: `Your Sisters Kitchen verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your Sisters Kitchen verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
  return true;
}

export function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}
