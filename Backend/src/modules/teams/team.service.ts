import { TeamModel, type ITeam } from '../../models/Team.model.ts';
import { AuctionModel } from '../../models/Auction.model.ts';
import { PlayerModel } from '../../models/Player.model.ts';

export class TeamService {
  /**
   * Helper to compute dynamic statistics for a team record
   */
  private static computeTeamStats(team: any, soldPlayers: any[], auction: any) {
    const teamSoldPlayers = soldPlayers.filter(
      (p) => p.teamId && p.teamId.toString() === team._id.toString()
    );

    const registeredPlayersCount = teamSoldPlayers.length;
    const usedPoints = teamSoldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const totalPoints = team.purseTotal;
    const remainingPoints = Math.max(0, totalPoints - usedPoints);
    const maxPlayers = team.maxPlayers || auction?.playersPerTeam || 15;
    const remainingSlots = Math.max(0, maxPlayers - registeredPlayersCount);
    const minBid = auction?.minimumBid || 0;

    // Calculate maximum allowable bid under bidding rules:
    // If team has reached max players, cannot bid anymore
    let maxBid = 0;
    if (remainingSlots > 0 && remainingPoints > 0) {
      if (remainingSlots > 1) {
        // Reserve minimum bid for the other (remainingSlots - 1) players
        const reserved = (remainingSlots - 1) * minBid;
        maxBid = Math.max(0, remainingPoints - reserved);
      } else {
        // Last slot can use all remaining points
        maxBid = remainingPoints;
      }

      // Cap at auction-wide maximum bid if configured
      if (auction?.maximumBid && auction.maximumBid > 0) {
        maxBid = Math.min(maxBid, auction.maximumBid);
      }
    }

    const teamObj = team.toObject ? team.toObject() : { ...team };
    return {
      ...teamObj,
      shortName: team.shortName || team.code,
      totalPoints,
      registeredPlayersCount,
      usedPoints,
      remainingPoints,
      maxBid,
      resPl: registeredPlayersCount,
      usedPts: usedPoints,
    };
  }

  static async listTeams(auctionId: string) {
    const [auction, teams, soldPlayers] = await Promise.all([
      AuctionModel.findById(auctionId),
      TeamModel.find({ auctionId }).sort({ name: 1 }),
      PlayerModel.find({ auctionId, status: 'SOLD' }).select('teamId soldPrice'),
    ]);

    return teams.map((team) => this.computeTeamStats(team, soldPlayers, auction));
  }

  static async getTeamById(auctionId: string, teamId: string) {
    const [auction, team, soldPlayers] = await Promise.all([
      AuctionModel.findById(auctionId),
      TeamModel.findOne({ _id: teamId, auctionId }),
      PlayerModel.find({ auctionId, status: 'SOLD' }).select('teamId soldPrice'),
    ]);

    if (!team) throw new Error('Team not found in this auction.');
    return this.computeTeamStats(team, soldPlayers, auction);
  }

  static async createTeam(auctionId: string, payload: any) {
    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found.');

    const purseTotal = payload.purseTotal ?? payload.initialPointsBalance ?? auction.pointsBalancePerTeam;
    const maxPlayers = payload.maxPlayers ?? auction.playersPerTeam;
    const code = (payload.code || payload.shortName || 'TM').toUpperCase().trim();
    const shortName = (payload.shortName || payload.code || code).toUpperCase().trim();

    // Support both logo string and logo object
    let logo = payload.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200';
    let logoData = payload.logoData;
    if (typeof payload.logo === 'object' && payload.logo !== null) {
      logo = payload.logo.url || logo;
      logoData = payload.logo;
    }

    const team = new TeamModel({
      ...payload,
      code,
      shortName,
      logo,
      logoData,
      auctionId,
      purseTotal,
      purseRemaining: payload.purseRemaining ?? purseTotal,
      maxPlayers,
      playersCount: 0,
    });

    await team.save();
    return this.getTeamById(auctionId, team._id.toString());
  }

  static async updateTeam(auctionId: string, teamId: string, payload: any) {
    const team = await TeamModel.findOne({ _id: teamId, auctionId });
    if (!team) throw new Error('Team not found.');

    if (payload.shortName && !payload.code) {
      payload.code = payload.shortName.toUpperCase().trim();
    }
    if (payload.code && !payload.shortName) {
      payload.shortName = payload.code.toUpperCase().trim();
    }
    if (typeof payload.logo === 'object' && payload.logo !== null) {
      team.logo = payload.logo.url || team.logo;
      team.logoData = payload.logo;
      delete payload.logo;
    }

    Object.assign(team, payload);
    await team.save();
    return this.getTeamById(auctionId, teamId);
  }

  static async deleteTeam(auctionId: string, teamId: string) {
    // Check if team has sold players or dependent records
    const soldCount = await PlayerModel.countDocuments({
      auctionId,
      teamId,
      status: 'SOLD',
    });

    if (soldCount > 0) {
      throw new Error(`Cannot delete team: ${soldCount} player(s) have already been sold to this team.`);
    }

    const result = await TeamModel.findOneAndDelete({ _id: teamId, auctionId });
    if (!result) throw new Error('Team not found.');
    return { success: true, message: 'Team deleted successfully.' };
  }
}
