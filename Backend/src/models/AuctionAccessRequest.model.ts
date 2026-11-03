import { Schema, model, type Document, type Types } from 'mongoose';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface IAuctionAccessRequest extends Document {
  auctionId: Types.ObjectId;
  userId: Types.ObjectId;
  status: AccessRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  decisionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auctionAccessRequestSchema = new Schema<IAuctionAccessRequest>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring only one access request record per user and auction
auctionAccessRequestSchema.index({ auctionId: 1, userId: 1 }, { unique: true });
auctionAccessRequestSchema.index({ status: 1, requestedAt: -1 });

export const AuctionAccessRequestModel = model<IAuctionAccessRequest>(
  'AuctionAccessRequest',
  auctionAccessRequestSchema
);
