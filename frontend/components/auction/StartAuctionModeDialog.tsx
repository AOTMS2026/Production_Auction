'use client';

import React, { useState } from 'react';
import { IoCloseOutline, IoRadioOutline, IoDesktopOutline, IoFlashOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

interface StartAuctionModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'NORMAL' | 'LIVE') => void;
  loading?: boolean;
  auctionName: string;
}

export const StartAuctionModeDialog: React.FC<StartAuctionModeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  auctionName,
}) => {
  const [selectedMode, setSelectedMode] = useState<'NORMAL' | 'LIVE'>('NORMAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#011428] border border-[#0d3f4f] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0d3f4f]/80 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#00d2ee]/40 bg-[#00d2ee]/10 text-[#00d2ee] text-[10px] font-mono tracking-wider uppercase mb-1">
              <IoFlashOutline className="size-3 text-[#00d2ee]" />
              <span>Session Launch</span>
            </div>
            <h3 className="text-xl font-mono uppercase tracking-wide text-white font-medium">Select Auction Mode</h3>
            <p className="text-xs text-[#7fa3b0] truncate max-w-sm mt-0.5">{auctionName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1 space-y-4 custom-scrollbar">
          <p className="text-xs text-[#8ab6c4]">
            Choose how you wish to operate the auction control center. Both modes enforce identical bidding budgets, roster policies, and database safeguards.
          </p>

          {/* Mode Option: NORMAL MODE */}
          <div
            onClick={() => setSelectedMode('NORMAL')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              selectedMode === 'NORMAL'
                ? 'bg-[#00d2ee]/10 border-[#00d2ee] shadow-[0_0_15px_rgba(0,210,238,0.25)]'
                : 'bg-[#021824] border-[#0d3f4f] hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  selectedMode === 'NORMAL' ? 'bg-[#00d2ee] text-[#02131b]' : 'bg-[#052735] text-[#7fa3b0]'
                }`}
              >
                <IoDesktopOutline className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-mono uppercase tracking-wider text-white font-medium">Normal Mode</h4>
                  <input
                    type="radio"
                    name="auction-mode"
                    checked={selectedMode === 'NORMAL'}
                    onChange={() => setSelectedMode('NORMAL')}
                    className="accent-[#00d2ee] size-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-[#7fa3b0] mt-1 leading-relaxed">
                  Recommended for standard administrator execution. Step-by-step bidding, manual or random player block control, roster tracking, and PDF/Excel generation.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#8ab6c4] border border-white/5">
                    Manual/Random Picker
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#8ab6c4] border border-white/5">
                    Bid Up / Down
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#8ab6c4] border border-white/5">
                    Sold / Unsold
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Option: LIVE MODE */}
          <div
            onClick={() => setSelectedMode('LIVE')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              selectedMode === 'LIVE'
                ? 'bg-[#00d2ee]/10 border-[#00d2ee] shadow-[0_0_15px_rgba(0,210,238,0.25)]'
                : 'bg-[#021824] border-[#0d3f4f] hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  selectedMode === 'LIVE' ? 'bg-[#00d2ee] text-[#02131b]' : 'bg-[#052735] text-[#7fa3b0]'
                }`}
              >
                <IoRadioOutline className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-mono uppercase tracking-wider text-white font-medium">Live Mode</h4>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono uppercase animate-pulse">
                      Real-Time
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="auction-mode"
                    checked={selectedMode === 'LIVE'}
                    onChange={() => setSelectedMode('LIVE')}
                    className="accent-[#00d2ee] size-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-[#7fa3b0] mt-1 leading-relaxed">
                  Real-time WebSocket synchronization across connected projector displays, team bidder screens, spectator dashboards, and auditor tablets with automatic reconnection.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#00d2ee]/10 text-[10px] text-[#00d2ee] border border-[#00d2ee]/20">
                    Socket.IO Multi-Screen
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#00d2ee]/10 text-[10px] text-[#00d2ee] border border-[#00d2ee]/20">
                    Zero-Lag Broadcast
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#00d2ee]/10 text-[10px] text-[#00d2ee] border border-[#00d2ee]/20">
                    Live Spectator Sync
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#02131b] border border-[#0d3f4f] flex items-center gap-2.5 text-xs text-[#7fa3b0]">
            <IoShieldCheckmarkOutline className="size-4 text-[#00d2ee] shrink-0" />
            <span>The selected mode is persisted in the session state and will be restored upon resume.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0d3f4f]/80 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-mono text-[#7fa3b0] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedMode)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#00d2ee] to-[#00b4d8] hover:from-[#38bdf8] hover:to-[#00d2ee] text-[#02131b] text-xs font-mono font-medium shadow-[0_0_20px_rgba(0,210,238,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="size-3.5 border-2 border-[#02131b] border-t-transparent rounded-full animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <span>Confirm & Start Auction</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
