import { PlayerModel, type IPlayer } from '../../models/Player.model.ts';
import { AuctionModel } from '../../models/Auction.model.ts';
import { TeamModel } from '../../models/Team.model.ts';

import { FormResolutionService } from '../form-builder/form-resolution.service.ts';

export class PlayerService {
  static async listPlayers(auctionId: string, filters: { role?: string; status?: string; search?: string; teamId?: string }) {
    const query: any = { auctionId };
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.teamId) query.teamId = filters.teamId;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return PlayerModel.find(query).populate('teamId', 'name code logo').sort({ name: 1 });
  }

  static async getPlayerById(auctionId: string, playerId: string) {
    const player = await PlayerModel.findOne({ _id: playerId, auctionId }).populate('teamId', 'name code logo');
    if (!player) throw new Error('Player not found in this auction.');
    return player;
  }

  static async createPlayer(auctionId: string, payload: any) {
    const auction = await AuctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found.');

    const data = { ...payload };
    const custom = data.customFields || {};
    const merged = { ...custom, ...data };

    // Resolve template if available to map labels and types
    let effective: any = null;
    try {
      effective = await FormResolutionService.resolveEffectiveForm(auctionId, 'PLAYER_REGISTRATION');
    } catch {
      // Ignore if no custom form
    }

    let extractedName = data.name || data.playerName || '';
    let extractedEmail = data.email || data.playerEmail || '';
    let extractedPhone = data.phone || data.playerPhone || '';
    let extractedRole = data.role || data.playerRole || '';
    let extractedBasePrice = Number(data.basePrice) || 0;
    let extractedImage = data.profileImage || '';
    const templateFieldMap = new Map<string, string>();

    if (effective && Array.isArray(effective.fields)) {
      for (const f of effective.fields) {
        if (f.key && f.label) templateFieldMap.set(f.key, f.label);
        const val = merged[f.key];
        if (val === undefined || val === null || val === '') continue;

        const kLower = (f.key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const lLower = (f.label || '').toLowerCase();

        if (!extractedImage && (f.type === 'image' || kLower.includes('image') || kLower.includes('photo') || lLower.includes('photo') || lLower.includes('image'))) {
          extractedImage = String(val);
        }
        if (!extractedEmail && (f.type === 'email' || kLower.includes('email') || lLower.includes('email') || (typeof val === 'string' && val.includes('@')))) {
          extractedEmail = String(val).trim();
        }
        if (!extractedPhone && (f.type === 'phone' || f.validation?.digitsOnly || kLower.includes('phone') || lLower.includes('phone') || lLower.includes('mobile'))) {
          extractedPhone = String(val).trim();
        }
        if (!extractedBasePrice && (kLower.includes('price') || lLower.includes('price') || lLower.includes('bid'))) {
          const num = Number(val);
          if (!isNaN(num) && num > 0) extractedBasePrice = num;
        }
        if (!extractedRole && (kLower.includes('role') || lLower.includes('role') || lLower.includes('position'))) {
          if (f.options && Array.isArray(f.options)) {
            const opt = f.options.find((o: any) => o.value === val);
            extractedRole = opt ? opt.label : String(val);
          } else {
            extractedRole = String(val);
          }
        }
        if (!extractedName && (f.type === 'text' || f.validation?.allowedCharacters === 'PERSON_NAME' || f.order === 1)) {
          if (kLower.includes('name') || lLower.includes('name') || kLower.includes('player')) {
            extractedName = String(val).trim();
          }
        }
      }
    }

    const playerName = extractedName || data.name || data.playerName || 'New Player';
    const playerEmail = (
      extractedEmail ||
      data.email ||
      data.playerEmail ||
      `${(playerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player')}_${Date.now()}@auction.local`
    )
      .toLowerCase()
      .trim();
    const role = extractedRole || data.role || 'Player';
    const basePrice = extractedBasePrice || Number(data.basePrice) || auction.minimumBid || 1000;
    const profileImage = extractedImage || data.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

    // Clean customFields
    const cleanCustomFields: Record<string, any> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (typeof v === 'string' && v.startsWith('data:image')) continue;
      if (['name', 'playerName', 'email', 'playerEmail', 'phone', 'playerPhone', 'role', 'basePrice', 'sport', 'profileImage', 'auctionId', 'teamId', 'customFields'].includes(k)) {
        continue;
      }
      const labelKey = templateFieldMap.get(k) || k;
      cleanCustomFields[labelKey] = v;
      // also keep raw key if different
      if (labelKey !== k) {
        cleanCustomFields[k] = v;
      }
    }

    const player = new PlayerModel({
      auctionId,
      teamId: data.teamId || null,
      name: playerName,
      email: playerEmail,
      phone: extractedPhone || data.phone || data.playerPhone || '',
      profileImage,
      sport: data.sport || auction.sport,
      role,
      basePrice,
      status: data.status || 'REGISTERED',
      customFields: cleanCustomFields,
      registrationFormVersion: effective?.version || 1,
    });

    await player.save();
    return player;
  }

  static async updatePlayer(auctionId: string, playerId: string, payload: Partial<IPlayer>) {
    const player = await PlayerModel.findOne({ _id: playerId, auctionId });
    if (!player) throw new Error('Player not found.');

    // If assigning to a team, update team player count
    if (payload.teamId && payload.teamId.toString() !== player.teamId?.toString()) {
      await TeamModel.findByIdAndUpdate(payload.teamId, { $inc: { playersCount: 1 } });
      if (player.teamId) {
        await TeamModel.findByIdAndUpdate(player.teamId, { $inc: { playersCount: -1 } });
      }
    }

    Object.assign(player, payload);
    await player.save();
    return player;
  }

  static async deletePlayer(auctionId: string, playerId: string) {
    const player = await PlayerModel.findOne({ _id: playerId, auctionId });
    if (!player) throw new Error('Player not found.');

    if (player.teamId) {
      await TeamModel.findByIdAndUpdate(player.teamId, { $inc: { playersCount: -1 } });
    }

    await PlayerModel.findByIdAndDelete(playerId);
    return { success: true, message: 'Player deleted successfully.' };
  }
}
