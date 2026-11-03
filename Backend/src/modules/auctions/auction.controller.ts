import type { Request, Response } from 'express';
import { AuctionService } from './auction.service.ts';
import { AuctionAccessService } from './auction-access.service.ts';
import { AuctionValidation } from './auction.validation.ts';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.ts';

export class AuctionController {
  /**
   * POST /api/v1/auctions (Admin)
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = AuctionValidation.validateCreate(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }

      const auction = await AuctionService.createAuction(req.user!.userId, validation.data);
      res.status(201).json({
        success: true,
        message: 'Auction created successfully in DRAFT status.',
        data: auction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create auction.' });
    }
  }

  /**
   * GET /api/v1/auctions (Public / User / Admin)
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionService.listAuctions(req.user, req.query as any);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch auctions.' });
    }
  }

  /**
   * GET /api/v1/auctions/:id (Access checked)
   */
  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionService.getAuctionById(req.params.id as string, req.user);
      if (!result.canAccess) {
        res.status(403).json({
          success: false,
          message: result.message,
          data: result.auction,
          requiresLogin: (result as any).requiresLogin || false,
          accessStatus: (result as any).accessStatus || 'NONE',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.auction,
        isOwner: (result as any).isOwner || false,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Auction not found.' });
    }
  }

  /**
   * PATCH /api/v1/auctions/:id (Admin)
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.updateAuction(req.params.id as string, req.user!.userId, req.body, req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Auction details updated successfully.',
        data: auction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update auction.' });
    }
  }

  /**
   * DELETE /api/v1/auctions/:id (Admin)
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionService.deleteAuction(req.params.id as string, req.user!.userId, req.user?.role);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete auction.' });
    }
  }

  /**
   * POST /api/v1/auctions/:id/publish (Admin)
   */
  static async publish(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.changeAuctionStatus(req.params.id as string, req.user!.userId, 'PUBLISHED', req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Auction has been published successfully.',
        data: auction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to publish auction.' });
    }
  }

  /**
   * POST /api/v1/auctions/:id/cancel (Admin)
   */
  static async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.changeAuctionStatus(req.params.id as string, req.user!.userId, 'CANCELLED', req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Auction has been cancelled.',
        data: auction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to cancel auction.' });
    }
  }

  /**
   * POST /api/v1/auctions/:id/archive (Admin)
   */
  static async archive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.changeAuctionStatus(req.params.id as string, req.user!.userId, 'ARCHIVED', req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Auction has been archived.',
        data: auction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to archive auction.' });
    }
  }

  /**
   * GET /api/v1/admin/metrics (Admin)
   */
  static async getAdminMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metrics = await AuctionService.getAdminMetrics(req.user!.userId, req.user?.role);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to load metrics.' });
    }
  }

  /**
   * POST /api/v1/auctions/:id/access-requests (User)
   */
  static async requestAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionAccessService.requestAccess(req.params.id as string, req.user!.userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to submit access request.' });
    }
  }

  /**
   * GET /api/v1/auctions/:id/access-requests/me (User)
   */
  static async getMyAccessStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionAccessService.getMyAccessStatus(req.params.id as string, req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to load access status.' });
    }
  }

  /**
   * GET /api/v1/admin/auctions/:id/access-requests (Admin)
   */
  static async listRequestsForAuction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requests = await AuctionAccessService.listRequestsForAuction(
        req.params.id as string,
        req.user!.userId,
        req.query.status as string,
        req.user?.role
      );
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch access requests.' });
    }
  }

  /**
   * GET /api/v1/admin/access-requests (Admin)
   */
  static async listAllAdminRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requests = await AuctionAccessService.listAllAdminRequests(
        req.user!.userId,
        req.query.status as string,
        req.user?.role
      );
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch access requests.' });
    }
  }

  /**
   * PATCH /api/v1/admin/access-requests/:requestId/approve (Admin)
   */
  static async approveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionAccessService.approveRequest(
        req.params.requestId as string,
        req.user!.userId,
        req.body?.decisionNote,
        req.user?.role
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to approve request.' });
    }
  }

  /**
   * PATCH /api/v1/admin/access-requests/:requestId/reject (Admin)
   */
  static async rejectRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionAccessService.rejectRequest(
        req.params.requestId as string,
        req.user!.userId,
        req.body?.decisionNote,
        req.user?.role
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to reject request.' });
    }
  }

  /**
   * DELETE /api/v1/admin/auctions/:id/participants/:userId (Admin)
   */
  static async revokeAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuctionAccessService.revokeAccess(
        req.params.id as string,
        req.params.userId as string,
        req.user!.userId,
        req.user?.role
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to revoke access.' });
    }
  }

  /**
   * GET /api/v1/auctions/:id/export-settings
   */
  static async getExportSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.getAuctionById(req.params.id as string, req.user);
      const settings = (auction.auction as any)?.exportSettings || {
        excelFields: ['playerCode', 'name', 'role', 'basePrice', 'teamName', 'soldPrice', 'status'],
        pdfFields: ['playerCode', 'name', 'role', 'basePrice', 'teamName', 'soldPrice'],
        showSummary: true,
        showTeamRosters: true,
      };
      res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /api/v1/auctions/:id/export-settings
   */
  static async updateExportSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AuctionService.updateAuction(req.params.id as string, req.user!.userId, {
        exportSettings: req.body,
      } as any, req.user?.role);
      res.status(200).json({ success: true, message: 'Export configuration saved', data: (updated as any).exportSettings });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/v1/auctions/:id/display-layout
   */
  static async getDisplayLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auction = await AuctionService.getAuctionById(req.params.id as string, req.user);
      const layout = (auction.auction as any)?.displayLayout || {
        visibleFields: ['name', 'playerCode', 'role', 'sport', 'basePrice', 'experience'],
        imageFitMode: 'cover',
      };
      res.status(200).json({ success: true, data: layout });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /api/v1/auctions/:id/display-layout
   */
  static async updateDisplayLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AuctionService.updateAuction(req.params.id as string, req.user!.userId, {
        displayLayout: req.body,
      } as any, req.user?.role);
      res.status(200).json({ success: true, message: 'Display layout saved', data: (updated as any).displayLayout });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
