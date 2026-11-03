import mongoose, { Document, Schema } from 'mongoose';

export type PlayerStatus = 'REGISTERED' | 'APPROVED' | 'AVAILABLE' | 'CURRENT' | 'SOLD' | 'UNSOLD' | 'WITHDRAWN';

export interface IPlayer extends Document {
  auctionId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  playerCode?: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  sport: string;
  role: string;
  experience?: string;
  basePrice: number;
  soldPrice?: number;
  status: PlayerStatus;
  customFields: Record<string, any>;
  registrationFormVersion: number;
  paymentMode?: string;
  paymentReceiptUrl?: string;
  paymentVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    playerCode: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    },
    sport: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      default: '1-3 years',
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    soldPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'APPROVED', 'AVAILABLE', 'CURRENT', 'SOLD', 'UNSOLD', 'WITHDRAWN'],
      default: 'REGISTERED',
      index: true,
    },
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    registrationFormVersion: {
      type: Number,
      default: 1,
    },
    paymentMode: {
      type: String,
      default: null,
    },
    paymentReceiptUrl: {
      type: String,
      default: null,
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PlayerSchema.index({ auctionId: 1, email: 1 }, { unique: true });
PlayerSchema.index({ auctionId: 1, status: 1 });

export const PlayerModel = mongoose.model<IPlayer>('Player', PlayerSchema);
