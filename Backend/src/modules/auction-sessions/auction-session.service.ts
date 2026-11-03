import mongoose from 'mongoose';
import { AuctionModel } from '../../models/Auction.model.ts';
import { AuctionSessionModel, type IAuctionSession, type SessionMode } from '../../models/AuctionSession.model.ts';
import { PlayerModel, type IPlayer } from '../../models/Player.model.ts';
import { TeamModel, type ITeam } from '../../models/Team.model.ts';
import { BidModel } from '../../models/Bid.model.ts';
import { emitToAuction } from '../../realtime/socket.ts';

export class AuctionSessionService {
  private static resolveObjectId(
    id?: string | null | mongoose.Types.ObjectId,
    fallbackId?: string | null | mongoose.Types.ObjectId
  ): mongoose.Types.ObjectId {
    if (id && mongoose.Types.ObjectId.isValid(String(id))) {
      return new mongoose.Types.ObjectId(String(id));
    }
    if (fallbackId && mongoose.Types.ObjectId.isValid(String(fallbackId))) {
      return new mongoose.Types.ObjectId(String(fallbackId));
    }
    return new mongoose.Types.ObjectId();
  }

  /**
   * Start or resume an auction session with mode selection
   */
  static async startSession(
    auctionId: string,
    mode: SessionMode = 'NORMAL',
    playerSelectionMode: 'RANDOM' | 'MANUAL' = 'RANDOM',
    userId?: string
  ) {
    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    let session = await AuctionSessionModel.findOne({ auctionId });
    if (!session) {
      const startedBy = this.resolveObjectId(userId, auction.ownerId);
      session = new AuctionSessionModel({
        auctionId,
        mode,
        playerSelectionMode,
        status: 'RUNNING',
        startedBy,
        startedAt: new Date(),
        version: 1,
      });
    } else {
      session.mode = mode;
      session.playerSelectionMode = playerSelectionMode;
      session.status = 'RUNNING';
      session.version += 1;
    }

    await session.save();

    // Ensure auction status reflects LIVE
    if (auction.status !== 'LIVE' && auction.status !== 'COMPLETED') {
      auction.status = 'LIVE';
      await auction.save();
    }

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Retrieve authoritative session state
   */
  static async getFullSessionState(auctionId: string) {
    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    let session = await AuctionSessionModel.findOne({ auctionId })
      .populate('currentPlayerId')
      .populate('selectedTeamId');

    const teams = await TeamModel.find({ auctionId }).sort({ name: 1 });
    const allPlayers = await PlayerModel.find({ auctionId });

    const soldCount = allPlayers.filter((p) => p.status === 'SOLD').length;
    const unsoldCount = allPlayers.filter((p) => p.status === 'UNSOLD').length;
    const availableCount = allPlayers.filter(
      (p) => ['REGISTERED', 'APPROVED', 'AVAILABLE'].includes(p.status) && !p.teamId
    ).length;
    const totalSpend = allPlayers.reduce((acc, p) => acc + (p.soldPrice || 0), 0);

    return {
      auction: {
        _id: auction._id,
        name: auction.name,
        sport: auction.sport,
        image: auction.image,
        scheduledAt: auction.scheduledAt,
        minimumBid: auction.minimumBid,
        maximumBid: auction.maximumBid,
        bidIncrement: auction.bidIncrement,
        playersPerTeam: auction.playersPerTeam,
        minPlayersPerTeam: auction.minPlayersPerTeam || 1,
        maxPlayersPerTeam: auction.maxPlayersPerTeam || auction.playersPerTeam || 15,
        rosterPolicy: auction.rosterPolicy || 'MANDATORY',
        pointsBalancePerTeam: auction.pointsBalancePerTeam,
        status: auction.status,
      },
      session: session
        ? {
            _id: session._id,
            mode: session.mode,
            status: session.status,
            playerSelectionMode: session.playerSelectionMode,
            currentPlayer: session.currentPlayerId || null,
            selectedTeam: session.selectedTeamId || null,
            currentBid: session.currentBid || 0,
            version: session.version,
            startedAt: session.startedAt,
          }
        : null,
      teams,
      stats: {
        sold: soldCount,
        unsold: unsoldCount,
        available: availableCount,
        totalRegistered: allPlayers.length,
        totalTeams: teams.length,
        totalSpend,
      },
    };
  }

  /**
   * Select a random eligible player
   */
  static async selectRandomPlayer(auctionId: string, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not currently running');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    // Eligible players
    const eligiblePlayers = await PlayerModel.find({
      auctionId,
      status: { $in: ['REGISTERED', 'APPROVED', 'AVAILABLE'] },
      teamId: null,
    });

    if (eligiblePlayers.length === 0) {
      throw new Error('No eligible players available for selection');
    }

    const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
    const selectedPlayer = eligiblePlayers[randomIndex];

    // Mark current player
    selectedPlayer.status = 'CURRENT';
    await selectedPlayer.save();

    session.currentPlayerId = selectedPlayer._id as mongoose.Types.ObjectId;
    session.currentBid = selectedPlayer.basePrice || auction.minimumBid;
    session.selectedTeamId = null;
    session.version += 1;
    await session.save();

    // Audit Bid Log
    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: selectedPlayer._id,
      amount: session.currentBid,
      action: 'PLAYER_SELECTED',
      actorId: this.resolveObjectId(userId, session.startedBy || auction.ownerId),
    });

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:player:selected', { player: selectedPlayer });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Select a player manually
   */
  static async selectManualPlayer(auctionId: string, playerId: string, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not currently running');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const player = await PlayerModel.findOne({
      _id: playerId,
      auctionId,
    });

    if (!player) throw new Error('Player not found');
    if (player.status === 'SOLD') throw new Error('Player is already sold');
    if (player.teamId) throw new Error('Player already assigned to a team');

    player.status = 'CURRENT';
    await player.save();

    session.currentPlayerId = player._id as mongoose.Types.ObjectId;
    session.currentBid = player.basePrice || auction.minimumBid;
    session.selectedTeamId = null;
    session.version += 1;
    await session.save();

    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: player._id,
      amount: session.currentBid,
      action: 'PLAYER_SELECTED',
      actorId: this.resolveObjectId(userId, session.startedBy || auction.ownerId),
    });

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:player:selected', { player });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Bid Up
   */
  static async bidUp(auctionId: string, teamId: string | undefined, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not running');
    }
    if (!session.currentPlayerId) {
      throw new Error('No player is currently on the auction block');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const nextBid = session.currentBid + auction.bidIncrement;
    if (auction.maximumBid && nextBid > auction.maximumBid) {
      throw new Error(`Bid amount (${nextBid}) exceeds maximum allowed bid (${auction.maximumBid})`);
    }

    if (teamId) {
      const team = await TeamModel.findById(teamId);
      if (!team) throw new Error('Selected team not found');
      if (team.purseRemaining < nextBid) {
        throw new Error(`Team ${team.name} has insufficient points balance (${team.purseRemaining}) for bid ${nextBid}`);
      }
      const maxPlayers = team.maxPlayers || auction.playersPerTeam || 15;
      if (team.playersCount >= maxPlayers) {
        throw new Error(`Team ${team.name} has already reached maximum roster limit (${maxPlayers})`);
      }
      session.selectedTeamId = team._id as mongoose.Types.ObjectId;
    }

    session.currentBid = nextBid;
    session.totalBidsCount += 1;
    session.version += 1;
    await session.save();

    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: session.currentPlayerId,
      teamId: session.selectedTeamId || null,
      amount: nextBid,
      action: 'BID_UP',
      actorId: this.resolveObjectId(userId, session.startedBy || auction.ownerId),
    });

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:bid:updated', { currentBid: nextBid, teamId });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Bid Down
   */
  static async bidDown(auctionId: string, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not running');
    }
    if (!session.currentPlayerId) {
      throw new Error('No player is currently on the auction block');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const player = await PlayerModel.findById(session.currentPlayerId);
    const minBid = player?.basePrice || auction.minimumBid || 500;

    const prevBid = session.currentBid - auction.bidIncrement;
    if (prevBid < minBid) {
      throw new Error(`Cannot decrease bid below minimum base price (${minBid})`);
    }

    session.currentBid = prevBid;
    session.version += 1;
    await session.save();

    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: session.currentPlayerId,
      teamId: session.selectedTeamId || null,
      amount: prevBid,
      action: 'BID_DOWN',
      actorId: this.resolveObjectId(userId, session.startedBy || auction.ownerId),
    });

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:bid:updated', { currentBid: prevBid });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Sold
   */
  static async sellPlayer(auctionId: string, teamId: string, customPrice: number | undefined, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not running');
    }
    if (!session.currentPlayerId) {
      throw new Error('No player is currently on the auction block to sell');
    }

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const team = await TeamModel.findById(teamId);
    if (!team) throw new Error('Winning team must be selected');

    const player = await PlayerModel.findById(session.currentPlayerId);
    if (!player) throw new Error('Player not found');
    if (player.status === 'SOLD') throw new Error('Player is already marked as sold');

    const finalAmount = customPrice !== undefined ? customPrice : session.currentBid;
    if (finalAmount <= 0) throw new Error('Final bid amount must be greater than zero');

    if (team.purseRemaining < finalAmount) {
      throw new Error(`Team ${team.name} has insufficient points balance (${team.purseRemaining}) for winning bid ${finalAmount}`);
    }

    const maxPlayers = team.maxPlayers || auction.playersPerTeam || 15;
    if (team.playersCount >= maxPlayers) {
      throw new Error(`Team ${team.name} has already reached maximum roster limit (${maxPlayers})`);
    }

    // Atomic update
    team.purseRemaining -= finalAmount;
    team.playersCount += 1;
    await team.save();

    player.status = 'SOLD';
    player.teamId = team._id as mongoose.Types.ObjectId;
    player.soldPrice = finalAmount;
    await player.save();

    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: player._id,
      teamId: team._id,
      amount: finalAmount,
      action: 'SOLD',
      actorId: this.resolveObjectId(userId, session.startedBy || auction.ownerId),
    });

    session.currentPlayerId = null;
    session.selectedTeamId = null;
    session.currentBid = 0;
    session.version += 1;
    await session.save();

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:player:sold', { player, team, finalAmount });
    emitToAuction(auctionId, 'auction:team:updated', { team });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Unsold
   */
  static async markUnsold(auctionId: string, userId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session || session.status !== 'RUNNING') {
      throw new Error('Auction session is not running');
    }
    if (!session.currentPlayerId) {
      throw new Error('No player is currently on the auction block');
    }

    const player = await PlayerModel.findById(session.currentPlayerId);
    if (!player) throw new Error('Player not found');

    player.status = 'UNSOLD';
    await player.save();

    await BidModel.create({
      auctionId,
      sessionId: session._id,
      playerId: player._id,
      amount: session.currentBid,
      action: 'UNSOLD',
      actorId: this.resolveObjectId(userId, session.startedBy),
    });

    session.currentPlayerId = null;
    session.selectedTeamId = null;
    session.currentBid = 0;
    session.version += 1;
    await session.save();

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:player:unsold', { player });
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Pause Session
   */
  static async pauseSession(auctionId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session) throw new Error('Session not found');

    session.status = 'PAUSED';
    await session.save();

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Resume Session
   */
  static async resumeSession(auctionId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session) throw new Error('Session not found');

    session.status = 'RUNNING';
    await session.save();

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Complete Session
   */
  static async completeSession(auctionId: string) {
    const session = await AuctionSessionModel.findOne({ auctionId });
    if (!session) throw new Error('Session not found');

    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    // Section 8: Mandatory Roster Enforcement
    if (auction.rosterPolicy === 'MANDATORY') {
      const teams = await TeamModel.find({ auctionId });
      const minRequired = auction.minPlayersPerTeam || auction.playersPerTeam || 1;
      const deficientTeams = teams.filter((t) => (t.playersCount || 0) < minRequired);
      if (deficientTeams.length > 0) {
        const teamNames = deficientTeams.map((t) => `${t.name} (${t.playersCount || 0}/${minRequired})`).join(', ');
        throw new Error(
          `Cannot complete auction under MANDATORY roster policy. The following teams have not satisfied the minimum roster requirement of ${minRequired} players: ${teamNames}`
        );
      }
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    await session.save();

    await AuctionModel.findByIdAndUpdate(auctionId, { status: 'COMPLETED' });

    const fullState = await this.getFullSessionState(auctionId);
    emitToAuction(auctionId, 'auction:completed', fullState);
    emitToAuction(auctionId, 'auction:state', fullState);
    return fullState;
  }

  /**
   * Get Eligible Players for manual selection
   */
  static async getEligiblePlayers(auctionId: string) {
    return PlayerModel.find({
      auctionId,
      status: { $in: ['REGISTERED', 'APPROVED', 'AVAILABLE'] },
      teamId: null,
    }).sort({ name: 1 });
  }

  /**
   * Get Tracking Record / Audit Bids
   */
  static async getTrackingBids(auctionId: string) {
    return BidModel.find({ auctionId })
      .populate('playerId', 'name playerCode role profileImage basePrice soldPrice status')
      .populate('teamId', 'name code logo')
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
  }
}
