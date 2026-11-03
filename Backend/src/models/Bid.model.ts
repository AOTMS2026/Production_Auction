import mongoose, { Document, Schema } from 'mongoose';

export type BidAction = 'BID_UP' | 'BID_DOWN' | 'SOLD' | 'UNSOLD' | 'PLAYER_SELECTED';

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  playerId?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  amount: number;
  action: BidAction;
  actorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AuctionSession',
      required: true,
      index: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    action: {
      type: String,
      enum: ['BID_UP', 'BID_DOWN', 'SOLD', 'UNSOLD', 'PLAYER_SELECTED'],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BidSchema.index({ auctionId: 1, createdAt: -1 });

export const BidModel = mongoose.model<IBid>('Bid', BidSchema);
