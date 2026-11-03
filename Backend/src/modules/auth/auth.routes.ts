import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { authenticateToken } from '../../middleware/auth.middleware.ts';

const router = Router();

// Registration & OTP
router.post('/register', AuthController.register);
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);

// Authentication & Session
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateToken as any, AuthController.me as any);

// Password Recovery
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Development & Admin Provisioning
router.post('/seed-admin', AuthController.seedAdmin);
router.post('/seed-user', AuthController.seedUser);
router.post('/promote-admin', AuthController.promoteAdmin);

export default router;
