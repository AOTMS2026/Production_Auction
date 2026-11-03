import { Types } from 'mongoose';
import { AuctionModel } from '../../models/Auction.model.ts';
import { AuctionAccessRequestModel } from '../../models/AuctionAccessRequest.model.ts';

export class AuctionAccessService {
  /**
   * User requests access to an invitation-only private auction.
   */
  static async requestAccess(auctionId: string, userId: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID.');
    }

    const auction = await AuctionModel.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
      throw new Error('Auction not found.');
    }

    if (auction.visibility !== 'PRIVATE') {
      return {
        success: true,
        message: 'This auction is public. No private access request is needed.',
        status: 'PUBLIC',
      };
    }

    const existingRequest = await AuctionAccessRequestModel.findOne({
      auctionId: new Types.ObjectId(auctionId),
      userId: new Types.ObjectId(userId),
    });

    if (existingRequest) {
      if (existingRequest.status === 'APPROVED') {
        return {
          success: true,
          message: 'You already have approved access to this private auction.',
          status: 'APPROVED',
        };
      }

      if (existingRequest.status === 'PENDING') {
        return {
          success: true,
          message: 'Your access request has already been submitted and is pending administrator review.',
          status: 'PENDING',
        };
      }

      // Re-apply if previously REJECTED or REVOKED
      existingRequest.status = 'PENDING';
      existingRequest.requestedAt = new Date();
      existingRequest.decisionNote = undefined;
      await existingRequest.save();

      return {
        success: true,
        message: 'Your access request has been re-submitted for administrator review.',
        status: 'PENDING',
      };
    }

    // Create new access request record
    const newRequest = new AuctionAccessRequestModel({
      auctionId: new Types.ObjectId(auctionId),
      userId: new Types.ObjectId(userId),
      status: 'PENDING',
      requestedAt: new Date(),
    });

    await newRequest.save();

    return {
      success: true,
      message: 'Access request submitted successfully. Waiting for administrator review.',
      status: 'PENDING',
    };
  }

  /**
   * Retrieves the current user's access status for a specific auction.
   */
  static async getMyAccessStatus(auctionId: string, userId: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID.');
    }

    const request = await AuctionAccessRequestModel.findOne({
      auctionId: new Types.ObjectId(auctionId),
      userId: new Types.ObjectId(userId),
    }).lean();

    return {
      status: request ? request.status : 'NONE',
      request,
    };
  }

  /**
   * Lists access requests for a specific auction (Admin only).
   */
  /**
   * Lists access requests for a specific auction (Admin or Owner).
   */
  static async listRequestsForAuction(auctionId: string, adminId: string, status?: string, role?: string) {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new Error('Invalid auction ID.');
    }

    const auction = await AuctionModel.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
      throw new Error('Auction not found.');
    }

    const isOwner = auction.ownerId && (auction.ownerId.toString() === adminId || (auction.ownerId as any)._id?.toString() === adminId);
    if (!isOwner && role !== 'ADMIN') {
      throw new Error('Unauthorized. You can only view requests for auctions you own.');
    }

    const query: any = { auctionId: new Types.ObjectId(auctionId) };
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    return await AuctionAccessRequestModel.find(query)
      .populate('userId', 'name email profileImage role isEmailVerified')
      .sort({ requestedAt: -1 })
      .lean();
  }

  /**
   * Lists all access requests across all auctions owned by the administrator or all if role is ADMIN.
   */
  static async listAllAdminRequests(adminId: string, status?: string, role?: string) {
    let query: any = {};
    if (role !== 'ADMIN') {
      const adminAuctions = await AuctionModel.find({
        ownerId: new Types.ObjectId(adminId),
        isDeleted: false,
      }).select('_id');
      const auctionIds = adminAuctions.map((a) => a._id);
      query.auctionId = { $in: auctionIds };
    }

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    return await AuctionAccessRequestModel.find(query)
      .populate('userId', 'name email profileImage role isEmailVerified')
      .populate('auctionId', 'name sport visibility status scheduledAt')
      .sort({ requestedAt: -1 })
      .lean();
  }

  /**
   * Approves a user's access request (Admin or Owner).
   */
  static async approveRequest(requestId: string, adminId: string, note?: string, role?: string) {
    const request = await AuctionAccessRequestModel.findById(requestId).populate('auctionId');
    if (!request) {
      throw new Error('Access request not found.');
    }

    const auction = request.auctionId as any;
    const isOwner = auction?.ownerId && (auction.ownerId.toString() === adminId || auction.ownerId._id?.toString() === adminId);
    if (!isOwner && role !== 'ADMIN') {
      throw new Error('Unauthorized to approve access for this auction.');
    }

    request.status = 'APPROVED';
    request.reviewedAt = new Date();
    request.reviewedBy = new Types.ObjectId(adminId);
    if (note) request.decisionNote = note.trim();

    await request.save();

    return {
      success: true,
      message: 'Access request approved. The user is now permitted to enter the private auction floor.',
      request,
    };
  }

  /**
   * Rejects a user's access request (Admin or Owner).
   */
  static async rejectRequest(requestId: string, adminId: string, note?: string, role?: string) {
    const request = await AuctionAccessRequestModel.findById(requestId).populate('auctionId');
    if (!request) {
      throw new Error('Access request not found.');
    }

    const auction = request.auctionId as any;
    const isOwner = auction?.ownerId && (auction.ownerId.toString() === adminId || auction.ownerId._id?.toString() === adminId);
    if (!isOwner && role !== 'ADMIN') {
      throw new Error('Unauthorized.');
    }

    request.status = 'REJECTED';
    request.reviewedAt = new Date();
    request.reviewedBy = new Types.ObjectId(adminId);
    if (note) request.decisionNote = note.trim();

    await request.save();

    return {
      success: true,
      message: 'Access request rejected.',
      request,
    };
  }

  /**
   * Revokes access previously granted to a participant (Admin or Owner).
   */
  static async revokeAccess(auctionId: string, userId: string, adminId: string, role?: string) {
    const auction = await AuctionModel.findById(auctionId);
    if (!auction) {
      throw new Error('Auction not found.');
    }

    const isOwner = auction.ownerId && (auction.ownerId.toString() === adminId || (auction.ownerId as any)._id?.toString() === adminId);
    if (!isOwner && role !== 'ADMIN') {
      throw new Error('Unauthorized.');
    }

    const request = await AuctionAccessRequestModel.findOne({
      auctionId: new Types.ObjectId(auctionId),
      userId: new Types.ObjectId(userId),
    });

    if (!request) {
      throw new Error('No access grant record found for this user.');
    }

    request.status = 'REVOKED';
    request.reviewedAt = new Date();
    request.reviewedBy = new Types.ObjectId(adminId);
    await request.save();

    return {
      success: true,
      message: 'Participant access has been revoked successfully.',
    };
  }
}
