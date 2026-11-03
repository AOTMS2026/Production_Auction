import { SponsorModel, type ISponsor } from '../../models/Sponsor.model.ts';

export class SponsorService {
  static async listSponsors(auctionId: string) {
    return SponsorModel.find({ auctionId }).sort({ order: 1, createdAt: 1 });
  }

  static async createSponsor(auctionId: string, payload: Partial<ISponsor>) {
    const sponsor = new SponsorModel({
      ...payload,
      auctionId,
    });
    await sponsor.save();
    return sponsor;
  }

  static async updateSponsor(auctionId: string, sponsorId: string, payload: Partial<ISponsor>) {
    const sponsor = await SponsorModel.findOne({ _id: sponsorId, auctionId });
    if (!sponsor) throw new Error('Sponsor not found.');
    Object.assign(sponsor, payload);
    await sponsor.save();
    return sponsor;
  }

  static async deleteSponsor(auctionId: string, sponsorId: string) {
    const result = await SponsorModel.findOneAndDelete({ _id: sponsorId, auctionId });
    if (!result) throw new Error('Sponsor not found.');
    return { success: true, message: 'Sponsor deleted successfully.' };
  }
}
