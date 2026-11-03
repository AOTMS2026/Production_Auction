import { Schema, model, type Document, type Types } from 'mongoose';

export type SportType = 'CRICKET' | 'VOLLEYBALL' | 'FOOTBALL' | 'KABADDI' | 'BADMINTON';
export type AuctionVisibility = 'PUBLIC' | 'PRIVATE';
export type AuctionStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface IAuction extends Document {
  name: string;
  slug: string;
  sport: SportType;
  image: {
    url: string;
    storageKey?: string;
  };
  scheduledAt: Date;
  timezone: string;
  playersPerTeam: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
  rosterPolicy?: 'MANDATORY' | 'FLEXIBLE';
  pointsBalancePerTeam: number;
  minimumBid: number;
  maximumBid: number;
  bidIncrement: number;
  exportSettings?: {
    excelFields?: string[];
    pdfFields?: string[];
    showSummary?: boolean;
    showTeamRosters?: boolean;
  };
  displayLayout?: {
    visibleFields?: string[];
    fieldOrder?: string[];
    imageFitMode?: string;
  };
  visibility: AuctionVisibility;
  status: AuctionStatus;
  ownerId: Types.ObjectId;
  currentBid: number;
  totalBids: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
  {
    name: {
      type: String,
      required: [true, 'Auction name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    sport: {
      type: String,
      enum: ['CRICKET', 'VOLLEYBALL', 'FOOTBALL', 'KABADDI', 'BADMINTON'],
      required: [true, 'Sport is required'],
      index: true,
    },
    image: {
      url: {
        type: String,
        required: [true, 'Auction cover image is required'],
      },
      storageKey: {
        type: String,
      },
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Auction scheduled date and time is required'],
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    playersPerTeam: {
      type: Number,
      required: [true, 'Players per team is required'],
      min: [1, 'Players per team must be at least 1'],
    },
    minPlayersPerTeam: {
      type: Number,
      default: 1,
      min: [1, 'Minimum players per team must be at least 1'],
    },
    maxPlayersPerTeam: {
      type: Number,
      default: 15,
      min: [1, 'Maximum players per team must be at least 1'],
    },
    rosterPolicy: {
      type: String,
      enum: ['MANDATORY', 'FLEXIBLE'],
      default: 'MANDATORY',
    },
    pointsBalancePerTeam: {
      type: Number,
      required: [true, 'Points balance per team is required'],
      min: [1, 'Points balance per team must be greater than 0'],
    },
    minimumBid: {
      type: Number,
      required: [true, 'Minimum bid is required'],
      min: [1, 'Minimum bid must be greater than 0'],
    },
    maximumBid: {
      type: Number,
      required: [true, 'Maximum bid is required'],
      min: [1, 'Maximum bid must be greater than 0'],
    },
    bidIncrement: {
      type: Number,
      required: [true, 'Bid increment is required'],
      min: [1, 'Bid increment must be greater than 0'],
    },
    exportSettings: {
      type: Schema.Types.Mixed,
      default: {
        excelFields: ['playerCode', 'name', 'role', 'basePrice', 'teamName', 'soldPrice', 'status'],
        pdfFields: ['playerCode', 'name', 'role', 'basePrice', 'teamName', 'soldPrice'],
        showSummary: true,
        showTeamRosters: true,
      },
    },
    displayLayout: {
      type: Schema.Types.Mixed,
      default: {
        visibleFields: ['name', 'playerCode', 'role', 'sport', 'basePrice', 'experience'],
        imageFitMode: 'cover',
      },
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      required: [true, 'Auction visibility is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    totalBids: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for filtering & querying
auctionSchema.index({ sport: 1, visibility: 1, status: 1 });
auctionSchema.index({ scheduledAt: 1, status: 1 });
auctionSchema.index({ isDeleted: 1, visibility: 1 });

export const AuctionModel = model<IAuction>('Auction', auctionSchema);
