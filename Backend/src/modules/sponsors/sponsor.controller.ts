import { type Request, type Response } from 'express';
import { SponsorService } from './sponsor.service.ts';

export class SponsorController {
  static async list(req: Request, res: Response) {
    try {
      const auctionId = String(req.params.auctionId);
      const sponsors = await SponsorService.listSponsors(auctionId);
      res.status(200).json({ success: true, count: sponsors.length, data: sponsors });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const auctionId = String(req.params.auctionId);
      const sponsor = await SponsorService.createSponsor(auctionId, req.body);
      res.status(201).json({ success: true, message: 'Sponsor added successfully.', data: sponsor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const auctionId = String(req.params.auctionId);
      const sponsorId = String(req.params.sponsorId);
      const sponsor = await SponsorService.updateSponsor(auctionId, sponsorId, req.body);
      res.status(200).json({ success: true, message: 'Sponsor updated successfully.', data: sponsor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const auctionId = String(req.params.auctionId);
      const sponsorId = String(req.params.sponsorId);
      const result = await SponsorService.deleteSponsor(auctionId, sponsorId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
