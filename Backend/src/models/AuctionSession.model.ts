import mongoose, { Document, Schema } from 'mongoose';

export type SessionMode = 'NORMAL' | 'LIVE';
export type SessionStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type PlayerSelectionMode = 'RANDOM' | 'MANUAL';

export interface IAuctionSession extends Document {
  auctionId: mongoose.Types.ObjectId;
  mode: SessionMode;
  status: SessionStatus;
  playerSelectionMode: PlayerSelectionMode;
  currentPlayerId?: mongoose.Types.ObjectId | null;
  selectedTeamId?: mongoose.Types.ObjectId | null;
  currentBid: number;
  version: number;
  startedBy: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  totalBidsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSessionSchema = new Schema<IAuctionSession>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['NORMAL', 'LIVE'],
      default: 'NORMAL',
      required: true,
    },
    status: {
      type: String,
      enum: ['READY', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'READY',
      index: true,
    },
    playerSelectionMode: {
      type: String,
      enum: ['RANDOM', 'MANUAL'],
      default: 'RANDOM',
    },
    currentPlayerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
      index: true,
    },
    selectedTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    currentBid: {
      type: Number,
      default: 0,
      min: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    startedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalBidsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

AuctionSessionSchema.index({ auctionId: 1, status: 1 });

export const AuctionSessionModel = mongoose.model<IAuctionSession>(
  'AuctionSession',
  AuctionSessionSchema
);
