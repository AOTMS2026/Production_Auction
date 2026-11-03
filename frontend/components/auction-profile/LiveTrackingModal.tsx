'use client';

import React, { useEffect, useState } from 'react';
import { IoCloseOutline, IoRadioOutline, IoTimeOutline, IoPersonOutline, IoShieldOutline } from 'react-icons/io5';
import { getTrackingBidsSession } from '@/lib/api';

interface LiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionName?: string;
  sport?: string;
  auctionId?: string;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  isOpen,
  onClose,
  auctionName = 'Live Auction',
  sport = 'Tournament',
  auctionId,
}) => {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && auctionId) {
      setLoading(true);
      getTrackingBidsSession(auctionId)
        .then((data) => setBids(data))
        .catch(() => setBids([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, auctionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#011428] border border-[#0d3f4f] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#0d3f4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <IoRadioOutline size={20} className="animate-pulse" />
            </span>
            <div>
              <h3 className="text-base font-mono uppercase tracking-wider font-medium text-white">Live Tracking Record</h3>
              <p className="text-xs text-[#7fa3b0]">
                {auctionName} • {sport}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-[#021824] border border-[#0d3f4f]">
            <span className="text-[10px] font-mono uppercase text-[#7fa3b0] block">Telemetry State</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
              Broadcasting Active
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#021824] border border-[#0d3f4f]">
            <span className="text-[10px] font-mono uppercase text-[#7fa3b0] block">Telemetry Channel</span>
            <span className="text-xs font-mono text-white mt-1 block">Socket.IO Real-time</span>
          </div>
          <div className="p-3 rounded-xl bg-[#021824] border border-[#0d3f4f]">
            <span className="text-[10px] font-mono uppercase text-[#7fa3b0] block">Gavel Latency</span>
            <span className="text-xs font-mono text-[#00d2ee] mt-1 block">Zero-Lag Sub-second</span>
          </div>
        </div>

        <div className="mt-4 flex-1 min-h-0 flex flex-col">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#7fa3b0] mb-2 shrink-0">
            Recent Floor Activity & Gavel Log
          </h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-[#7fa3b0]">Loading audit history...</div>
            ) : bids.length > 0 ? (
              bids.map((bid, i) => (
                <div
                  key={bid._id || i}
                  className="p-3 rounded-xl bg-[#021824] border border-[#0d3f4f] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        bid.action === 'SOLD'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : bid.action === 'UNSOLD'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#00d2ee]/20 text-[#00d2ee] border border-[#00d2ee]/30'
                      }`}
                    >
                      {bid.action}
                    </span>
                    <span className="text-white">
                      {bid.playerId?.name || 'Player'}
                      {bid.teamId?.name && ` → ${bid.teamId.name}`}
                      {bid.amount ? ` (${bid.amount.toLocaleString()} pts)` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7fa3b0] flex items-center gap-1">
                    <IoTimeOutline size={12} />
                    {new Date(bid.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs font-mono text-[#7fa3b0] border border-dashed border-[#0d3f4f] rounded-xl">
                No floor bidding actions recorded yet. Bids and gavel events will appear here in real time.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#0d3f4f] mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono text-[#7fa3b0] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
