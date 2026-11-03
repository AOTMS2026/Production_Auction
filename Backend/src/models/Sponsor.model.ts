import mongoose, { Document, Schema } from 'mongoose';

export type SponsorTier = 'TITLE' | 'POWERED_BY' | 'ASSOCIATE' | 'KIT' | 'MEDIA';

export interface ISponsor extends Document {
  auctionId: mongoose.Types.ObjectId;
  name: string;
  tier: SponsorTier;
  logo: string;
  website?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorSchema = new Schema<ISponsor>(
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
    tier: {
      type: String,
      enum: ['TITLE', 'POWERED_BY', 'ASSOCIATE', 'KIT', 'MEDIA'],
      default: 'ASSOCIATE',
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    },
    website: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

SponsorSchema.index({ auctionId: 1, order: 1 });

export const SponsorModel = mongoose.model<ISponsor>('Sponsor', SponsorSchema);
