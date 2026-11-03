import { type Request, type Response } from 'express';
import { TeamService } from './team.service.ts';

export class TeamController {
  static async list(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teams = await TeamService.listTeams(auctionId);
      res.status(200).json({ success: true, count: teams.length, data: teams });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teamId = req.params.teamId as string;
      const team = await TeamService.getTeamById(auctionId, teamId);
      res.status(200).json({ success: true, data: team });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const team = await TeamService.createTeam(auctionId, req.body);
      res.status(201).json({ success: true, message: 'Team created successfully.', data: team });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teamId = req.params.teamId as string;
      const team = await TeamService.updateTeam(auctionId, teamId, req.body);
      res.status(200).json({ success: true, message: 'Team updated successfully.', data: team });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teamId = req.params.teamId as string;
      const result = await TeamService.deleteTeam(auctionId, teamId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
