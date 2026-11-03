import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuctionSessionService } from './auction-session.service.ts';

function getValidUserId(req: Request): string {
  const user = (req as any).user;
  const userDoc = (req as any).userDoc;
  const raw = user?.userId || user?.id || user?._id || userDoc?._id;
  if (raw && mongoose.Types.ObjectId.isValid(String(raw))) {
    return String(raw);
  }
  return '';
}

export class AuctionSessionController {
  static async startSession(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const { mode, playerSelectionMode } = req.body;
      const userId = getValidUserId(req);

      const state = await AuctionSessionService.startSession(
        auctionId,
        mode || 'NORMAL',
        playerSelectionMode || 'RANDOM',
        userId
      );
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getState(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const state = await AuctionSessionService.getFullSessionState(auctionId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async selectRandomPlayer(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const userId = getValidUserId(req);
      const state = await AuctionSessionService.selectRandomPlayer(auctionId, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async selectManualPlayer(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const { playerId } = req.body;
      const userId = getValidUserId(req);
      if (!playerId) {
        return res.status(400).json({ success: false, message: 'playerId is required' });
      }
      const state = await AuctionSessionService.selectManualPlayer(auctionId, playerId, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async bidUp(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const { teamId } = req.body;
      const userId = getValidUserId(req);
      const state = await AuctionSessionService.bidUp(auctionId, teamId, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async bidDown(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const userId = getValidUserId(req);
      const state = await AuctionSessionService.bidDown(auctionId, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async sellPlayer(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const { teamId, customPrice } = req.body;
      const userId = getValidUserId(req);
      if (!teamId) {
        return res.status(400).json({ success: false, message: 'teamId is required to sell player' });
      }
      const state = await AuctionSessionService.sellPlayer(auctionId, teamId, customPrice, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async markUnsold(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const userId = getValidUserId(req);
      const state = await AuctionSessionService.markUnsold(auctionId, userId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async pauseSession(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const state = await AuctionSessionService.pauseSession(auctionId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async resumeSession(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const state = await AuctionSessionService.resumeSession(auctionId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async completeSession(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const state = await AuctionSessionService.completeSession(auctionId);
      res.status(200).json({ success: true, data: state });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getEligiblePlayers(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const players = await AuctionSessionService.getEligiblePlayers(auctionId);
      res.status(200).json({ success: true, data: players });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getTrackingBids(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const tracking = await AuctionSessionService.getTrackingBids(auctionId);
      res.status(200).json({ success: true, data: tracking });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
