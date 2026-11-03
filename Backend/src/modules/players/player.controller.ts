import { type Request, type Response } from 'express';
import { PlayerService } from './player.service.ts';

export class PlayerController {
  static async list(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const { role, status, search, teamId } = req.query;
      const players = await PlayerService.listPlayers(auctionId, {
        role: role as string,
        status: status as string,
        search: search as string,
        teamId: teamId as string,
      });
      res.status(200).json({ success: true, count: players.length, data: players });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const playerId = req.params.playerId as string;
      const player = await PlayerService.getPlayerById(auctionId, playerId);
      res.status(200).json({ success: true, data: player });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const player = await PlayerService.createPlayer(auctionId, req.body);
      res.status(201).json({ success: true, message: 'Player registered successfully.', data: player });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const playerId = req.params.playerId as string;
      const player = await PlayerService.updatePlayer(auctionId, playerId, req.body);
      res.status(200).json({ success: true, message: 'Player updated successfully.', data: player });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const playerId = req.params.playerId as string;
      const result = await PlayerService.deletePlayer(auctionId, playerId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
