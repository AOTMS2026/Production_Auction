"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Team } from "@/types/auction";

interface DeleteTeamDialogProps {
  isOpen: boolean;
  team: Team | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  isOpen,
  team,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !team) return null;

  const soldCount = team.registeredPlayersCount ?? team.resPl ?? team.playersCount ?? 0;
  const hasSoldPlayers = soldCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#02131b] border border-[#0d3f4f] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3f4f]">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="size-5 shrink-0" />
            <h3 className="text-base font-semibold font-mono uppercase tracking-wide">
              Delete Team
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#7fa3b0] hover:text-white hover:bg-[#072433] transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs sm:text-sm text-[#9ab0bd] leading-relaxed">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-bold text-white">&quot;{team.name}&quot;</span> (
            <span className="font-mono text-[#00d2ee]">{team.code || team.shortName}</span>)?
          </p>

          {hasSoldPlayers ? (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-1">
              <p className="font-semibold text-rose-200">Deletion Blocked</p>
              <p>
                This team currently has {soldCount} sold player(s) allocated to it. Per tournament
                regulations, teams with purchased players cannot be removed to preserve auction
                history.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#7fa3b0]">
              This action cannot be undone. All roster slots and purse configurations for this team will
              be cleared.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0d3f4f]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-[#7fa3b0] hover:text-white bg-[#031822] hover:bg-[#042433] border border-[#0d3f4f] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || hasSoldPlayers}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
          >
            {loading ? (
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Delete Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};
