import { Schema, model, type Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
      default: 'EMAIL_VERIFICATION',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired OTPs after 1 hour using MongoDB TTL
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const OtpModel = model<IOtp>('Otp', otpSchema);
