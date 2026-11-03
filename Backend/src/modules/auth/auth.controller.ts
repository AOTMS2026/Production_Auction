import type { Request, Response } from 'express';
import { AuthService, sanitizeUser } from './auth.service.ts';
import { AuthValidation } from './auth.validation.ts';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.ts';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const validation = AuthValidation.validateRegister(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.register(validation.data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Registration failed.' });
    }
  }

  static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, purpose } = req.body || {};
      const validation = AuthValidation.validateEmail(email);
      if (!validation.valid) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.resendOtp(email, purpose || 'EMAIL_VERIFICATION');
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to send OTP.' });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const validation = AuthValidation.validateVerifyOtp(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.verifyOtp(validation.data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'OTP verification failed.' });
    }
  }

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, purpose } = req.body || {};
      const validation = AuthValidation.validateEmail(email);
      if (!validation.valid) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.resendOtp(email, purpose || 'EMAIL_VERIFICATION');
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to resend OTP.' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = AuthValidation.validateLogin(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.login(validation.data);
      if (result.requiresVerification) {
        res.status(403).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Invalid credentials.' });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken || typeof refreshToken !== 'string') {
        res.status(400).json({ success: false, message: 'Refresh token is required.' });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Token refresh failed.' });
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: 'Session terminated successfully.' });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.userDoc) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(req.userDoc),
    });
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body || {};
      const validation = AuthValidation.validateEmail(email);
      if (!validation.valid) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to process password reset.' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const validation = AuthValidation.validateResetPassword(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const result = await AuthService.resetPassword(validation.data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Password reset failed.' });
    }
  }

  static async seedAdmin(_req: Request, res: Response): Promise<void> {
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const { UserModel } = await import('../../models/User.model.ts');

      let admin = await UserModel.findOne({ email: 'admin@aotms.com' });
      if (!admin) {
        const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
        admin = new UserModel({
          name: 'AOTMS Administrator',
          email: 'admin@aotms.com',
          password: hashedPassword,
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          isEmailVerified: true,
        });
        await admin.save();
      } else {
        admin.role = 'ADMIN';
        admin.isEmailVerified = true;
        await admin.save();
      }

      res.status(200).json({
        success: true,
        message: 'Admin account provisioned: admin@aotms.com / AdminPass123!',
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async seedUser(req: Request, res: Response): Promise<void> {
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const { UserModel } = await import('../../models/User.model.ts');
      const email = (req.body?.email || 'bidder@premier.com').toLowerCase().trim();
      const password = req.body?.password || 'Password123!';
      const name = req.body?.name || 'Pro Bidder';

      let user = await UserModel.findOne({ email });
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!user) {
        user = new UserModel({
          name,
          email,
          password: hashedPassword,
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          role: 'USER',
          isEmailVerified: true,
        });
        await user.save();
      } else {
        user.password = hashedPassword;
        user.role = 'USER';
        user.isEmailVerified = true;
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: `User account provisioned: ${email} / ${password}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async promoteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body || {};
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      const { UserModel } = await import('../../models/User.model.ts');
      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      user.role = 'ADMIN';
      user.isEmailVerified = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User ${user.email} promoted to ADMIN successfully.`,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

