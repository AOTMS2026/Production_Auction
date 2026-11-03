import type { SportType, AuctionVisibility, AuctionStatus } from '../../models/Auction.model.ts';

const VALID_SPORTS: SportType[] = ['CRICKET', 'VOLLEYBALL', 'FOOTBALL', 'KABADDI', 'BADMINTON'];
const VALID_VISIBILITIES: AuctionVisibility[] = ['PUBLIC', 'PRIVATE'];
const VALID_STATUSES: AuctionStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'SCHEDULED',
  'LIVE',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
];

export interface CreateAuctionInput {
  name: string;
  sport: SportType;
  image: string;
  scheduledAt: string | Date;
  timezone?: string;
  playersPerTeam: number;
  pointsBalancePerTeam: number;
  minimumBid: number;
  maximumBid: number;
  bidIncrement: number;
  visibility: AuctionVisibility;
}

export interface UpdateAuctionInput {
  name?: string;
  sport?: SportType;
  image?: string;
  scheduledAt?: string | Date;
  timezone?: string;
  playersPerTeam?: number;
  pointsBalancePerTeam?: number;
  minimumBid?: number;
  maximumBid?: number;
  bidIncrement?: number;
  visibility?: AuctionVisibility;
}

export class AuctionValidation {
  static validateCreate(body: any): { valid: boolean; error?: string; data?: CreateAuctionInput } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be an object' };
    }

    const {
      name,
      sport,
      image,
      imageUrl,
      scheduledAt,
      timezone,
      playersPerTeam,
      pointsBalancePerTeam,
      minimumBid,
      maximumBid,
      bidIncrement,
      visibility,
    } = body;

    // 1. Name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: 'Auction name is required and cannot be empty.' };
    }

    // 2. Sport
    const normalizedSport = String(sport || '').trim().toUpperCase() as SportType;
    if (!VALID_SPORTS.includes(normalizedSport)) {
      return {
        valid: false,
        error: `Sport must be one of: ${VALID_SPORTS.join(', ')}.`,
      };
    }

    // 3. Image
    const finalImage = typeof image === 'string' ? image.trim() : (typeof imageUrl === 'string' ? imageUrl.trim() : '');
    if (!finalImage) {
      return { valid: false, error: 'Auction cover image is required.' };
    }

    // 4. Date & Time
    if (!scheduledAt) {
      return { valid: false, error: 'Auction scheduled date and time is required.' };
    }
    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: 'Invalid scheduled date and time format.' };
    }

    // 5. Numerical constraints
    const parsedPlayers = Number(playersPerTeam);
    if (!Number.isInteger(parsedPlayers) || parsedPlayers <= 0) {
      return { valid: false, error: 'Players per team must be a positive integer.' };
    }

    const parsedPoints = Number(pointsBalancePerTeam);
    if (isNaN(parsedPoints) || parsedPoints <= 0) {
      return { valid: false, error: 'Points balance per team must be greater than 0.' };
    }

    const parsedMinBid = Number(minimumBid);
    if (isNaN(parsedMinBid) || parsedMinBid <= 0) {
      return { valid: false, error: 'Minimum bid must be greater than 0.' };
    }

    const parsedMaxBid = Number(maximumBid);
    if (isNaN(parsedMaxBid) || parsedMaxBid < parsedMinBid) {
      return { valid: false, error: 'Maximum bid must be greater than or equal to minimum bid.' };
    }

    const parsedIncrement = Number(bidIncrement);
    if (isNaN(parsedIncrement) || parsedIncrement <= 0) {
      return { valid: false, error: 'Bid increment must be greater than 0.' };
    }

    // 6. Visibility
    const normalizedVisibility = String(visibility || '').trim().toUpperCase() as AuctionVisibility;
    if (!VALID_VISIBILITIES.includes(normalizedVisibility)) {
      return { valid: false, error: 'Visibility must be either PUBLIC or PRIVATE.' };
    }

    return {
      valid: true,
      data: {
        name: name.trim(),
        sport: normalizedSport,
        image: finalImage,
        scheduledAt: parsedDate,
        timezone: typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC',
        playersPerTeam: parsedPlayers,
        pointsBalancePerTeam: parsedPoints,
        minimumBid: parsedMinBid,
        maximumBid: parsedMaxBid,
        bidIncrement: parsedIncrement,
        visibility: normalizedVisibility,
      },
    };
  }

  static validateStatusTransition(currentStatus: AuctionStatus, targetStatus: AuctionStatus): boolean {
    const validTransitions: Record<AuctionStatus, AuctionStatus[]> = {
      DRAFT: ['PUBLISHED', 'CANCELLED'],
      PUBLISHED: ['DRAFT', 'SCHEDULED', 'LIVE', 'CANCELLED'],
      SCHEDULED: ['LIVE', 'CANCELLED', 'PUBLISHED'],
      LIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: ['ARCHIVED'],
      CANCELLED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    return validTransitions[currentStatus]?.includes(targetStatus) || false;
  }
}
