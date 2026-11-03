import { Team } from "@/types/auction";
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/lib/api";

export const teamService = {
  getTeams: (auctionId: string): Promise<Team[]> => getTeams(auctionId),
  createTeam: (auctionId: string, payload: Partial<Team>, token: string): Promise<Team> =>
    createTeam(auctionId, payload, token),
  updateTeam: (auctionId: string, teamId: string, payload: Partial<Team>, token: string): Promise<Team> =>
    updateTeam(auctionId, teamId, payload, token),
  deleteTeam: (auctionId: string, teamId: string, token: string): Promise<void> =>
    deleteTeam(auctionId, teamId, token),
};
