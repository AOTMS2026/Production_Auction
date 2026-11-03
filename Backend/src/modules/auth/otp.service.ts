import crypto from 'node:crypto';
import { OtpModel } from '../../models/Otp.model.ts';

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || 'https://aotms.app.n8n.cloud/webhook/Auction';
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export class OtpService {
  /**
   * Generates a 6-digit cryptographically secure OTP, stores its hash, and dispatches via n8n.
   */
  static async generateAndSendOtp(
    email: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
  ): Promise<{ success: boolean; message: string; expiryMinutes: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Invalidate all previous unused OTPs for this email and purpose
    await OtpModel.updateMany(
      { email: normalizedEmail, purpose, isUsed: false },
      { $set: { isUsed: true } }
    );

    // 2. Generate cryptographically secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 3. Persist hashed OTP into database
    await OtpModel.create({
      email: normalizedEmail,
      otpHash,
      purpose,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    // 4. Dispatch OTP delivery to n8n webhook
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AOTMS-Auction-Backend/1.0',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: rawOtp,
          purpose,
        }),
      });

      if (!response.ok) {
        console.error(`n8n webhook responded with status ${response.status}`);
        return {
          success: false,
          message: 'Failed to deliver OTP email via webhook service. Please try again.',
          expiryMinutes: OTP_EXPIRY_MINUTES,
        };
      }

      return {
        success: true,
        message: 'OTP has been dispatched to your email address.',
        expiryMinutes: OTP_EXPIRY_MINUTES,
      };
    } catch (error) {
      console.error('Error invoking n8n webhook for OTP delivery:', error instanceof Error ? error.message : error);
      return {
        success: false,
        message: 'Email delivery service temporarily unreachable. Please try resending later.',
        expiryMinutes: OTP_EXPIRY_MINUTES,
      };
    }
  }

  /**
   * Validates an entered OTP against the active hash in database.
   */
  static async verifyOtp(
    email: string,
    enteredOtp: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
  ): Promise<{ valid: boolean; reason?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const activeOtp = await OtpModel.findOne({
      email: normalizedEmail,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!activeOtp) {
      return { valid: false, reason: 'No active OTP found. Please request a new OTP.' };
    }

    if (activeOtp.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      activeOtp.isUsed = true;
      await activeOtp.save();
      return { valid: false, reason: 'Too many incorrect attempts. This OTP has been invalidated.' };
    }

    if (new Date() > activeOtp.expiresAt) {
      activeOtp.isUsed = true;
      await activeOtp.save();
      return { valid: false, reason: 'The OTP has expired. Please request a replacement OTP.' };
    }

    const enteredHash = hashOtp(enteredOtp.trim());
    if (enteredHash !== activeOtp.otpHash) {
      activeOtp.attempts += 1;
      await activeOtp.save();
      return {
        valid: false,
        reason: `Incorrect OTP code. ${MAX_VERIFICATION_ATTEMPTS - activeOtp.attempts} attempts remaining.`,
      };
    }

    // Mark OTP as used to guarantee single-use enforcement
    activeOtp.isUsed = true;
    await activeOtp.save();

    return { valid: true };
  }
}
