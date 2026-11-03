export interface RegisterInput {
  name?: string;
  email: string;
  password: string;
  profileImage: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export class AuthValidation {
  static validateEmail(email?: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is mandatory.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, error: 'Invalid email format.' };
    }
    return { valid: true };
  }

  static validateRegister(body: any): { valid: boolean; error?: string; data?: RegisterInput } {
    const { name, email, password, profileImage } = body || {};

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { valid: false, error: emailCheck.error };
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return { valid: false, error: 'Password is mandatory and must be at least 6 characters.' };
    }

    if (!profileImage || typeof profileImage !== 'string' || profileImage.trim().length === 0) {
      return { valid: false, error: 'Profile image is mandatory during registration.' };
    }

    return {
      valid: true,
      data: {
        name: typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'Auction Member',
        email: email.trim().toLowerCase(),
        password,
        profileImage: profileImage.trim(),
      },
    };
  }

  static validateVerifyOtp(body: any): { valid: boolean; error?: string; data?: VerifyOtpInput } {
    const { email, otp } = body || {};

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { valid: false, error: emailCheck.error };
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return { valid: false, error: 'A valid 6-digit numeric OTP is required.' };
    }

    return {
      valid: true,
      data: {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      },
    };
  }

  static validateLogin(body: any): { valid: boolean; error?: string; data?: LoginInput } {
    const { email, password } = body || {};

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { valid: false, error: emailCheck.error };
    }

    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required.' };
    }

    return {
      valid: true,
      data: {
        email: email.trim().toLowerCase(),
        password,
      },
    };
  }

  static validateResetPassword(body: any): { valid: boolean; error?: string; data?: ResetPasswordInput } {
    const { email, otp, newPassword } = body || {};

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { valid: false, error: emailCheck.error };
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return { valid: false, error: 'A valid 6-digit numeric OTP is required.' };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return { valid: false, error: 'New password must be at least 6 characters.' };
    }

    return {
      valid: true,
      data: {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      },
    };
  }
}
