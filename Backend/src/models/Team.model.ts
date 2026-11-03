import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  auctionId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  shortName?: string;
  logo: string;
  logoData?: {
    url: string;
    publicId?: string;
  };
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  purseTotal: number;
  purseRemaining: number;
  playersCount: number;
  maxPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
    },
    logoData: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    ownerName: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },
    purseTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    purseRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    playersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxPlayers: {
      type: Number,
      default: 15,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ auctionId: 1, name: 1 }, { unique: true });
TeamSchema.index({ auctionId: 1, code: 1 }, { unique: true });

export const TeamModel = mongoose.model<ITeam>('Team', TeamSchema);
