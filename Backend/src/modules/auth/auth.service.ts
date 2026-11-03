import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, type IUser } from '../../models/User.model.ts';
import { OtpService } from './otp.service.ts';
import type { RegisterInput, VerifyOtpInput, LoginInput, ResetPasswordInput } from './auth.validation.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'auction_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function sanitizeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function generateTokens(user: IUser) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
    expiresIn: '30d' as any,
  });

  return { accessToken, refreshToken };
}

export class AuthService {
  /**
   * Registers a new user, hashes password, assigns USER role, and sends OTP via n8n.
   */
  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isEmailVerified) {
      throw new Error('An account with this email address is already registered.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    let user: IUser;
    if (existingUser) {
      // Unverified account re-attempting registration: update details
      existingUser.name = input.name || existingUser.name;
      existingUser.password = hashedPassword;
      existingUser.profileImage = input.profileImage;
      existingUser.role = 'USER'; // enforce USER role
      await existingUser.save();
      user = existingUser;
    } else {
      user = await UserModel.create({
        name: input.name,
        email: normalizedEmail,
        password: hashedPassword,
        profileImage: input.profileImage,
        role: 'USER', // strictly assign USER role for public registration
        isEmailVerified: false,
      });
    }

    // Trigger OTP dispatch via n8n webhook
    const otpResult = await OtpService.generateAndSendOtp(normalizedEmail, 'EMAIL_VERIFICATION');

    return {
      success: true,
      message: otpResult.success
        ? 'Registration initiated. Verification OTP has been sent to your email.'
        : 'Registration initiated, but email delivery encountered an issue. You may request a resend.',
      email: user.email,
      requiresVerification: true,
      expiryMinutes: otpResult.expiryMinutes,
    };
  }

  /**
   * Verifies the email OTP, marks user verified, and returns JWT session tokens.
   */
  static async verifyOtp(input: VerifyOtpInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const verification = await OtpService.verifyOtp(normalizedEmail, input.otp, 'EMAIL_VERIFICATION');
    if (!verification.valid) {
      throw new Error(verification.reason || 'Invalid OTP code.');
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new Error('User record not found.');
    }

    user.isEmailVerified = true;
    await user.save();

    const tokens = generateTokens(user);

    return {
      success: true,
      message: 'Email address successfully verified! Your account is now active.',
      user: sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Resends an OTP to the user's email.
   */
  static async resendOtp(email: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION') {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('No account found associated with this email.');
    }

    if (purpose === 'EMAIL_VERIFICATION' && user.isEmailVerified) {
      throw new Error('This account email is already verified.');
    }

    const result = await OtpService.generateAndSendOtp(normalizedEmail, purpose);
    return {
      success: result.success,
      message: result.message,
      email: normalizedEmail,
      expiryMinutes: result.expiryMinutes,
    };
  }

  /**
   * Authenticates user with email & password, checks verification status.
   */
  static async login(input: LoginInput) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid email or password.');
    }

    // Guard: Unverified account cannot log in
    if (!user.isEmailVerified) {
      // Proactively trigger fresh OTP dispatch so user can verify immediately
      await OtpService.generateAndSendOtp(normalizedEmail, 'EMAIL_VERIFICATION');
      return {
        success: false,
        requiresVerification: true,
        message: 'Your email is not verified yet. A fresh verification code has been dispatched to your inbox.',
        email: user.email,
      };
    }

    const tokens = generateTokens(user);

    return {
      success: true,
      message: 'Authentication successful.',
      user: sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Renews the access token using a valid refresh token.
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found.');
      }

      const tokens = generateTokens(user);
      return {
        success: true,
        accessToken: tokens.accessToken,
      };
    } catch {
      throw new Error('Invalid or expired refresh token.');
    }
  }

  /**
   * Initiates password reset via n8n OTP delivery.
   */
  static async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      // Generic message to avoid email enumeration attacks
      return {
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      };
    }

    await OtpService.generateAndSendOtp(normalizedEmail, 'PASSWORD_RESET');
    return {
      success: true,
      message: 'Password reset code has been dispatched to your email.',
    };
  }

  /**
   * Verifies reset OTP and updates user's password.
   */
  static async resetPassword(input: ResetPasswordInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const verification = await OtpService.verifyOtp(normalizedEmail, input.otp, 'PASSWORD_RESET');
    if (!verification.valid) {
      throw new Error(verification.reason || 'Invalid OTP code.');
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new Error('User not found.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(input.newPassword, salt);
    await user.save();

    return {
      success: true,
      message: 'Password has been updated successfully. Please log in with your new credentials.',
    };
  }
}
