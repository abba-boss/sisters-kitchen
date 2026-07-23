import crypto from "crypto";
import { logger } from "./logger";

/**
 * Delivery for password-reset OTPs.
 * - Always logs the code (so local/dev works without SMTP).
 * - If SMTP_* env vars are set later, you can swap this to nodemailer.
 */
export async function deliverPasswordResetOtp(email: string, otp: string): Promise<void> {
  logger.info(`[password-reset] OTP for ${email}: ${otp} (valid 10 minutes)`);

  // Optional hook for future SMTP providers — no dependency required.
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    logger.info(`[password-reset] SMTP configured — integrate nodemailer to send to ${email}`);
  }
}

export function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}
