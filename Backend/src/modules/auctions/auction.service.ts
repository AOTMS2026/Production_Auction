import { Types } from 'mongoose';
import { AuctionModel, type IAuction, type AuctionStatus } from '../../models/Auction.model.ts';
import { AuctionAccessRequestModel } from '../../models/AuctionAccessRequest.model.ts';
import { AuctionValidation, type CreateAuctionInput, type UpdateAuctionInput } from './auction.validation.ts';
import type { AuthenticatedUserPayload } from '../../middleware/auth.middleware.ts';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
}

export interface AuctionFilterParams {
  sport?: string;
  visibility?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AuctionService {
  /**
   * Creates a new auction in DRAFT status. (Admin only)
   */
  static async createAuction(ownerId: string, input: CreateAuctionInput): Promise<IAuction> {
    const slug = generateSlug(input.name);

    const auction = new AuctionModel({
      name: input.name,
      slug,
      sport: input.sport,
      image: {
        url: input.image,
      },
      scheduledAt: input.scheduledAt,
      timezone: input.timezone || 'UTC',
      playersPerTeam: input.playersPerTeam,
      pointsBalancePerTeam: input.pointsBalancePerTeam,
      minimumBid: input.minimumBid,
      maximumBid: input.maximumBid,
      bidIncrement: input.bidIncrement,
      visibility: input.visibility,
      status: 'DRAFT',
      ownerId: new Types.ObjectId(ownerId),
    });

    return await auction.save();
  }

  /**
   * Lists auctions enforcing RBAC & Visibility rules.
   * - Public callers see only published public auctions.
   * - Admins see all auctions they manage (or system auctions).
   * - Users see published public auctions + private auctions they have approved access for.
   */
  static async listAuctions(user?: AuthenticatedUserPayload, filters: AuctionFilterParams = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    // Sport filter
    if (filters.sport && filters.sport.toUpperCase() !== 'ALL') {
      query.sport = filters.sport.toUpperCase();
    }

    // Status filter
    if (filters.status && filters.status.toUpperCase() !== 'ALL') {
      query.status = filters.status.toUpperCase();
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      query.name = { $regex: filters.search.trim(), $options: 'i' };
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.toUpperCase() !== 'ALL') {
      query.visibility = filters.visibility.toUpperCase();
    }

    // RBAC & Visibility query construction
    if (user && user.role === 'ADMIN') {
      // Admin sees all auctions (including all draft arenas, published, scheduled, etc.)
    } else if (user) {
      // Authenticated User:
      // Always allowed to see:
      // 1. Any auctions THEY OWN (all statuses, including DRAFT)
      // 2. Any private auctions where they have approved access
      // 3. Public auctions
      const approvedRequests = await AuctionAccessRequestModel.find({
        userId: new Types.ObjectId(user.userId),
        status: 'APPROVED',
      }).select('auctionId');

      const approvedAuctionIds = approvedRequests.map((r) => r.auctionId);

      const userConditions: any[] = [
        { ownerId: new Types.ObjectId(user.userId) },
        { _id: { $in: approvedAuctionIds } },
      ];

      if (query.status) {
        userConditions.push({ visibility: 'PUBLIC', status: query.status });
      } else {
        userConditions.push({ visibility: 'PUBLIC' });
      }

      delete query.status;
      query.$or = userConditions;
    } else {
      // Unauthenticated visitor
      query.visibility = 'PUBLIC';
    }

    // Sorting
    const sortField = filters.sortBy || 'scheduledAt';
    const sortDir = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDir };

    const [items, total] = await Promise.all([
      AuctionModel.find(query)
        .populate('ownerId', 'name email profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuctionModel.countDocuments(query),
    ]);

    // If caller is an authenticated user, attach their access request status to each auction
    let enrichedItems: any[] = items;
    if (user && user.role === 'USER') {
      const userRequests = await AuctionAccessRequestModel.find({
        userId: new Types.ObjectId(user.userId),
        auctionId: { $in: items.map((i) => i._id) },
      }).lean();

      const requestMap = new Map(userRequests.map((r) => [r.auctionId.toString(), r.status]));

      enrichedItems = items.map((item) => ({
        ...item,
        userAccessStatus: requestMap.get(item._id.toString()) || 'NONE',
      }));
    }

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves an auction by ID, strictly verifying private access permissions.
   */
  static async getAuctionById(auctionId: string, user?: AuthenticatedUserPayload) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID format.');
    }

    const auction = await AuctionModel.findOne({ _id: auctionId, isDeleted: false })
      .populate('ownerId', 'name email profileImage')
      .lean();

    if (!auction) {
      throw new Error('Auction not found.');
    }

    // If auction is PUBLIC and visible, anyone can read details
    if (auction.visibility === 'PUBLIC') {
      return {
        auction,
        canAccess: true,
      };
    }

    // Auction is PRIVATE:
    if (!user) {
      return {
        auction: {
          _id: auction._id,
          name: auction.name,
          sport: auction.sport,
          image: auction.image,
          visibility: auction.visibility,
          status: auction.status,
        },
        canAccess: false,
        requiresLogin: true,
        message: 'This is a private auction. Please sign in to request access.',
      };
    }

    // Admin or Owner has full access
    if (user.role === 'ADMIN' || auction.ownerId._id?.toString() === user.userId) {
      return {
        auction,
        canAccess: true,
        isOwner: true,
      };
    }

    // Check user's access request status
    const accessRequest = await AuctionAccessRequestModel.findOne({
      auctionId: auction._id,
      userId: new Types.ObjectId(user.userId),
    }).lean();

    if (accessRequest && accessRequest.status === 'APPROVED') {
      return {
        auction,
        canAccess: true,
        accessStatus: 'APPROVED',
      };
    }

    // Not authorized yet
    return {
      auction: {
        _id: auction._id,
        name: auction.name,
        sport: auction.sport,
        image: auction.image,
        scheduledAt: auction.scheduledAt,
        visibility: auction.visibility,
        status: auction.status,
      },
      canAccess: false,
      accessStatus: accessRequest ? accessRequest.status : 'NONE',
      message:
        accessRequest?.status === 'PENDING'
          ? 'Your access request is currently pending administrator approval.'
          : 'This is an invitation-only private auction. You must request access to enter.',
    };
  }

  /**
   * Updates an auction. (Admin or Owner)
   */
  static async updateAuction(auctionId: string, ownerId: string, updates: UpdateAuctionInput, role?: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID format.');
    }

    const auction = await AuctionModel.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
      throw new Error('Auction not found.');
    }

    const isOwner = auction.ownerId && (auction.ownerId.toString() === ownerId || (auction.ownerId as any)._id?.toString() === ownerId);
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized. You can only modify auctions you own.');
    }

    if (['COMPLETED', 'ARCHIVED'].includes(auction.status)) {
      throw new Error(`Cannot modify an auction in ${auction.status} status.`);
    }

    // If LIVE, lock bidding rule changes
    if (auction.status === 'LIVE') {
      delete updates.minimumBid;
      delete updates.maximumBid;
      delete updates.bidIncrement;
      delete updates.pointsBalancePerTeam;
    }

    if (updates.name && updates.name.trim()) auction.name = updates.name.trim();
    if (updates.sport) auction.sport = updates.sport;
    if (updates.image) auction.image = { url: updates.image.trim() };
    if (updates.scheduledAt) auction.scheduledAt = new Date(updates.scheduledAt);
    if (updates.timezone) auction.timezone = updates.timezone;
    if (updates.playersPerTeam) auction.playersPerTeam = updates.playersPerTeam;
    if (updates.pointsBalancePerTeam) auction.pointsBalancePerTeam = updates.pointsBalancePerTeam;
    if (updates.minimumBid) auction.minimumBid = updates.minimumBid;
    if (updates.maximumBid) auction.maximumBid = updates.maximumBid;
    if (updates.bidIncrement) auction.bidIncrement = updates.bidIncrement;
    if (updates.visibility) auction.visibility = updates.visibility;

    return await auction.save();
  }

  /**
   * Transitions auction status through the approved lifecycle.
   */
  static async changeAuctionStatus(auctionId: string, ownerId: string, targetStatus: AuctionStatus, role?: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID format.');
    }

    const auction = await AuctionModel.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
      throw new Error('Auction not found.');
    }

    const isOwner = auction.ownerId && (auction.ownerId.toString() === ownerId || (auction.ownerId as any)._id?.toString() === ownerId);
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized. You can only manage auctions you own.');
    }

    const isValid = AuctionValidation.validateStatusTransition(auction.status, targetStatus);
    if (!isValid) {
      throw new Error(`Invalid status transition from ${auction.status} to ${targetStatus}.`);
    }

    auction.status = targetStatus;
    return await auction.save();
  }

  /**
   * Deletes an auction (permanently if DRAFT with 0 bids; otherwise soft-delete).
   */
  static async deleteAuction(auctionId: string, ownerId: string, role?: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID format.');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction || auction.isDeleted) {
      return { success: true, message: 'Auction already removed.' };
    }

    const isOwner = auction.ownerId && (auction.ownerId.toString() === ownerId || (auction.ownerId as any)._id?.toString() === ownerId);
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized. You can only delete auctions you own.');
    }

    if (auction.status === 'DRAFT' && (auction.totalBids || 0) === 0) {
      await AuctionModel.findByIdAndDelete(auctionId);
      return { success: true, message: 'Draft auction permanently removed.' };
    }

    auction.isDeleted = true;
    auction.deletedAt = new Date();
    auction.status = 'CANCELLED';
    await auction.save();

    return { success: true, message: 'Auction archived and cancelled successfully.' };
  }

  /**
   * Admin dashboard summary metrics.
   */
  static async getAdminMetrics(ownerId: string, role?: string) {
    const baseQuery: any = { isDeleted: false };
    if (role !== 'ADMIN') {
      baseQuery.ownerId = new Types.ObjectId(ownerId);
    }

    const [total, drafts, published, scheduled, live, completed, pendingRequests] = await Promise.all([
      AuctionModel.countDocuments({ ...baseQuery }),
      AuctionModel.countDocuments({ ...baseQuery, status: 'DRAFT' }),
      AuctionModel.countDocuments({ ...baseQuery, status: 'PUBLISHED' }),
      AuctionModel.countDocuments({ ...baseQuery, status: 'SCHEDULED' }),
      AuctionModel.countDocuments({ ...baseQuery, status: 'LIVE' }),
      AuctionModel.countDocuments({ ...baseQuery, status: 'COMPLETED' }),
      AuctionAccessRequestModel.countDocuments({ status: 'PENDING' }),
    ]);

    return {
      total,
      drafts,
      published,
      scheduled,
      live,
      completed,
      pendingRequests,
    };
  }
}
