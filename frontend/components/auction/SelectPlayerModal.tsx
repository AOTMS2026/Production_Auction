'use client';

import React, { useState, useMemo } from 'react';
import { IoCloseOutline, IoSearchOutline, IoPersonOutline, IoCheckmarkOutline, IoPricetagOutline } from 'react-icons/io5';
import { Player } from '@/types/auction';

interface SelectPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  loading?: boolean;
}

export const SelectPlayerModal: React.FC<SelectPlayerModalProps> = ({
  isOpen,
  onClose,
  players,
  onSelectPlayer,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  const roles = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.role) set.add(p.role);
    });
    return ['ALL', ...Array.from(set)];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.playerCode && p.playerCode.toLowerCase().includes(search.toLowerCase())) ||
        (p.sport && p.sport.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = selectedRole === 'ALL' || p.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [players, search, selectedRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#011428] border border-[#0d3f4f] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0d3f4f]/80 shrink-0">
          <div>
            <h3 className="text-lg font-mono uppercase tracking-wider text-white font-medium">
              Select Player to Auction Block
            </h3>
            <p className="text-xs text-[#7fa3b0] mt-0.5">
              Choose an eligible player from the registered pool ({filteredPlayers.length} available)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7fa3b0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player name or code..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono text-white bg-[#021824] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee] transition-all"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                  selectedRole === r
                    ? 'bg-[#00d2ee] text-[#02131b] font-medium shadow-sm'
                    : 'bg-[#021824] border border-[#0d3f4f] text-[#7fa3b0] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* List of Players */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1 space-y-2 custom-scrollbar">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#0d3f4f] rounded-xl">
              <IoPersonOutline className="size-8 mx-auto text-[#7fa3b0] mb-2" />
              <p className="text-xs font-mono text-[#7fa3b0]">No eligible players match your query.</p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#021824] border border-[#0d3f4f] hover:border-[#00d2ee]/50 hover:bg-[#032233] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-11 rounded-lg overflow-hidden border border-[#00d2ee]/40 bg-[#011428] shrink-0">
                    <img
                      src={player.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={player.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-mono text-white truncate font-medium">{player.name}</h4>
                      {player.playerCode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30">
                          {player.playerCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#7fa3b0] mt-0.5">
                      <span className="uppercase text-[11px] text-[#00d2ee]">{player.role}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#8ab6c4]">
                        <IoPricetagOutline className="size-3 text-emerald-400" />
                        Base: {player.basePrice?.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onSelectPlayer(player)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d2ee] hover:bg-[#00b8d4] text-[#02131b] text-xs font-mono font-medium transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <IoCheckmarkOutline className="size-4" />
                  <span>Put on Block</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-[#0d3f4f]/80 mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono text-[#7fa3b0] hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
