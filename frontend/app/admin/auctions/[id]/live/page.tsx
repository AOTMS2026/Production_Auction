'use client';

import React, { useEffect, useState, useMemo, useRef, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IoArrowBackOutline,
  IoDownloadOutline,
  IoDocumentTextOutline,
  IoRadioOutline,
  IoDesktopOutline,
  IoTimeOutline,
  IoPeopleOutline,
  IoPricetagOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoShuffleOutline,
  IoListOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoCheckmarkDoneOutline,
  IoPauseOutline,
  IoPlayOutline,
  IoRefreshOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoTrophyOutline,
  IoFlashOutline,
  IoColorPaletteOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import {
  PlayerDisplaySettingsModal,
  THEME_PRESETS,
  AVATAR_SIZE_MAP,
  FONT_SIZE_MAP,
  CARD_SCALE_MAP,
  ARENA_SPLIT_MAP,
  CARD_SPLIT_MAP,
  NAME_FONT_SIZE_MAP,
  BID_FONT_SIZE_MAP,
  SNO_FONT_SIZE_MAP,
  BADGES_SIZE_MAP,
  CONTROLS_SIZE_MAP,
  TEAMS_COLUMNS_MAP,
  TEAM_CARD_SIZE_MAP,
  type ArenaSplitId,
  type PlayerCardSplitId,
  type PhotoPositionId,
  type TeamsColumnsId,
  type TeamCardSizeId,
  type NameFontSizeId,
  type BidFontSizeId,
  type SnoFontSizeId,
  type BadgesSizeId,
  type ControlsSizeId,
  type CardElementId,
  type AvatarSizeId,
  type FontSizeId,
  type CardScaleId,
  type FieldColumnsId,
} from '@/components/auction-profile/PlayerDisplaySettingsModal';
import { AutoScrollText } from '@/components/ui/AutoScrollText';
import { io, Socket } from 'socket.io-client';
import {
  getAuctionSessionState,
  startAuctionSession,
  selectRandomPlayer,
  selectManualPlayer,
  bidUpSession,
  bidDownSession,
  sellPlayerSession,
  unsoldPlayerSession,
  pauseAuctionSession,
  resumeAuctionSession,
  completeAuctionSession,
  getEligiblePlayersSession,
  getTrackingBidsSession,
  getStoredToken,
  type AuctionSessionState,
} from '@/lib/api';
import { Player, Team } from '@/types/auction';
import { SelectPlayerModal } from '@/components/auction/SelectPlayerModal';
import { exportAuctionExcel, exportAuctionPDF } from '@/lib/exportUtils';
import { LiveTrackingModal } from '@/components/auction-profile/LiveTrackingModal';
import {
  Landmark,
  Pencil,
  Undo2,
  Eye,
  Shuffle,
  List,
  Gavel,
  X,
  SlidersHorizontal,
} from 'lucide-react';

function formatPurseShort(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    const k = val / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(val);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function LiveAuctionControlContent({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'NORMAL' | 'LIVE') || 'NORMAL';

  // Core Auction State
  const [sessionState, setSessionState] = useState<AuctionSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realtime Socket status
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Player selection mode: RANDOM vs MANUAL
  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'MANUAL'>('RANDOM');
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [eligiblePlayers, setEligiblePlayers] = useState<Player[]>([]);

  // Selected Team for bidding / winning
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Tracking & Preview Modals
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isTeamPreviewOpen, setIsTeamPreviewOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);

  // Copy Code
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom sell price modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  const auction = sessionState?.auction;
  const session = sessionState?.session;
  const currentPlayer = session?.currentPlayer || null;
  const teams = sessionState?.teams || [];
  const stats = sessionState?.stats || {
    sold: 0,
    unsold: 0,
    available: 0,
    totalRegistered: 0,
    totalTeams: 0,
    totalSpend: 0,
  };

  const displayLayout = (auction as any)?.displayLayout || {};
  const themeId = displayLayout.themeColor || 'cyan';
  const activeTheme = useMemo(() => {
    return THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  }, [themeId]);
  const cardLayout = displayLayout.cardLayout || 'stadium';
  const customTagline = displayLayout.customTagline || '';
  const showBidTicker = displayLayout.showBidTicker !== false;
  const showSponsors = displayLayout.showSponsors !== false;

  // Customized Column Split & Size Adjustments (Default 2 Columns, 3 Rows Fit)
  const arenaSplit = (displayLayout.arenaSplit || '8-4') as ArenaSplitId;
  const playerCardSplit = (displayLayout.playerCardSplit || '4-8') as PlayerCardSplitId;
  const photoPosition = (displayLayout.photoPosition || 'left') as PhotoPositionId;
  const teamsColumns = (displayLayout.teamsColumns || '2') as TeamsColumnsId;
  const teamCardSize = (displayLayout.teamCardSize || 'md') as TeamCardSizeId;
  const nameFontSize = (displayLayout.nameFontSize || '2xl') as NameFontSizeId;
  const bidFontSize = (displayLayout.bidFontSize || '2xl') as BidFontSizeId;
  const snoFontSize = (displayLayout.snoFontSize || 'xl') as SnoFontSizeId;
  const badgesSize = (displayLayout.badgesSize || 'md') as BadgesSizeId;
  const controlsSize = (displayLayout.controlsSize || 'md') as ControlsSizeId;
  const photoAspect = displayLayout.photoAspect || 'tall';
  const elementOrder = (displayLayout.elementOrder || ['sno', 'name', 'badges', 'bid']) as CardElementId[];
  const showPillsUnderPhoto = displayLayout.showPillsUnderPhoto !== false;

  const avatarSize = (displayLayout.avatarSize || 'md') as AvatarSizeId;
  const fontSize = (displayLayout.fontSize || 'md') as FontSizeId;
  const cardScale = (displayLayout.cardScale || 'normal') as CardScaleId;
  const fieldColumns = (displayLayout.fieldColumns || '2') as FieldColumnsId;
  const fieldOrder = (displayLayout.fieldOrder || []) as string[];
  const visibleKeys = (displayLayout.visibleFields || []) as string[];

  const avatarConfig = AVATAR_SIZE_MAP[avatarSize] || AVATAR_SIZE_MAP.md;
  const fontConfig = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP.md;
  const cardScaleConfig = CARD_SCALE_MAP[cardScale] || CARD_SCALE_MAP.normal;

  // 1. Initial Load & Start Session if needed
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const token = getStoredToken() || undefined;

        // Try getting existing state first
        let state: AuctionSessionState;
        try {
          state = await getAuctionSessionState(auctionId);
          // If no running session, start one with initialMode
          if (!state.session || state.session.status !== 'RUNNING') {
            state = await startAuctionSession(auctionId, initialMode, 'RANDOM', token);
          }
        } catch {
          // Start session
          state = await startAuctionSession(auctionId, initialMode, 'RANDOM', token);
        }

        if (mounted) {
          setSessionState(state);
          if (state.session?.playerSelectionMode) {
            setSelectionMode(state.session.playerSelectionMode);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to initialize auction session');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [auctionId, initialMode]);

  // 2. Realtime Socket.IO Connection (for both Live and Normal mode updates)
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_auction', auctionId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to authoritative state broadcasts
    socket.on('auction:state', (updatedState: AuctionSessionState) => {
      setSessionState(updatedState);
    });

    socket.on('auction:bid:updated', (data: { currentBid: number; teamId?: string }) => {
      setSessionState((prev) => {
        if (!prev || !prev.session) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            currentBid: data.currentBid,
            selectedTeam: data.teamId ? prev.teams.find((t) => t._id === data.teamId) || null : prev.session.selectedTeam,
          },
        };
      });
    });

    return () => {
      socket.emit('leave_auction', auctionId);
      socket.disconnect();
    };
  }, [auctionId]);

  // Handle Team Selection Click
  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team._id === selectedTeamId ? null : team._id);
  };

  // Next / Random Player
  const handleNextPlayer = async () => {
    if (selectionMode === 'RANDOM') {
      try {
        setActionLoading(true);
        setError(null);
        const newState = await selectRandomPlayer(auctionId);
        setSessionState(newState);
        setSelectedTeamId(null);
      } catch (err: any) {
        setError(err.message || 'No more eligible players available');
      } finally {
        setActionLoading(false);
      }
    } else {
      // Manual mode: Open player picker
      try {
        setActionLoading(true);
        const pool = await getEligiblePlayersSession(auctionId);
        setEligiblePlayers(pool);
        setIsPlayerPickerOpen(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load eligible players');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Manual Player Selected from Picker Modal
  const handlePlayerChosen = async (player: Player) => {
    try {
      setActionLoading(true);
      setIsPlayerPickerOpen(false);
      const newState = await selectManualPlayer(auctionId, player._id);
      setSessionState(newState);
      setSelectedTeamId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to place player on auction block');
    } finally {
      setActionLoading(false);
    }
  };

  // Bid Up
  const handleBidUp = async () => {
    if (!currentPlayer) return;
    try {
      setActionLoading(true);
      setError(null);
      const newState = await bidUpSession(auctionId, selectedTeamId || undefined);
      setSessionState(newState);
    } catch (err: any) {
      setError(err.message || 'Bid Up rejected');
    } finally {
      setActionLoading(false);
    }
  };

  // Bid Down
  const handleBidDown = async () => {
    if (!currentPlayer) return;
    try {
      setActionLoading(true);
      setError(null);
      const newState = await bidDownSession(auctionId);
      setSessionState(newState);
    } catch (err: any) {
      setError(err.message || 'Bid Down rejected');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Sold Confirmation
  const openSoldDialog = () => {
    if (!selectedTeamId) {
      setError('Please click on a winning team on the right panel before marking SOLD');
      return;
    }
    setCustomPriceInput(String(session?.currentBid || currentPlayer?.basePrice || 0));
    setSellModalOpen(true);
  };

  // Confirm Sold
  const handleConfirmSold = async () => {
    if (!selectedTeamId) return;
    const price = customPriceInput ? Number(customPriceInput) : session?.currentBid;
    try {
      setActionLoading(true);
      setError(null);
      setSellModalOpen(false);
      const newState = await sellPlayerSession(auctionId, selectedTeamId, price);
      setSessionState(newState);
      setSelectedTeamId(null);
    } catch (err: any) {
      setError(err.message || 'Sale failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Unsold
  const handleMarkUnsold = async () => {
    if (!currentPlayer) return;
    try {
      setActionLoading(true);
      setError(null);
      const newState = await unsoldPlayerSession(auctionId);
      setSessionState(newState);
      setSelectedTeamId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to mark as unsold');
    } finally {
      setActionLoading(false);
    }
  };

  // Pause / Resume
  const handleTogglePause = async () => {
    try {
      setActionLoading(true);
      if (session?.status === 'PAUSED') {
        const newState = await resumeAuctionSession(auctionId);
        setSessionState(newState);
      } else {
        const newState = await pauseAuctionSession(auctionId);
        setSessionState(newState);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update session state');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Auction
  const handleCompleteAuction = async () => {
    if (!confirm('Are you sure you want to finalize and COMPLETE this entire auction?')) return;
    try {
      setActionLoading(true);
      const newState = await completeAuctionSession(auctionId);
      setSessionState(newState);
    } catch (err: any) {
      setError(err.message || 'Failed to complete auction');
    } finally {
      setActionLoading(false);
    }
  };

  // Exports
  const handleExportExcel = () => {
    if (!auction) return;
    const payload = {
      auction: {
        name: auction.name,
        sport: auction.sport,
        playersPerTeam: auction.playersPerTeam,
        pointsBalancePerTeam: auction.pointsBalancePerTeam,
        minimumBid: auction.minimumBid,
        maximumBid: auction.maximumBid,
        bidIncrement: auction.bidIncrement,
      },
      teams: teams.map((t) => ({
        name: t.name,
        code: t.code,
        purseRemaining: t.purseRemaining,
        playersCount: t.playersCount,
        maxPlayers: t.maxPlayers,
        ownerName: t.ownerName,
      })),
      players: currentPlayer ? [currentPlayer] : [],
      stats,
    };
    exportAuctionExcel(payload, `${auction.name.replace(/\s+/g, '_')}_Results.xlsx`);
  };

  const handleExportPDF = () => {
    if (!auction) return;
    const payload = {
      auction: {
        name: auction.name,
        sport: auction.sport,
        playersPerTeam: auction.playersPerTeam,
        pointsBalancePerTeam: auction.pointsBalancePerTeam,
        minimumBid: auction.minimumBid,
        maximumBid: auction.maximumBid,
        bidIncrement: auction.bidIncrement,
      },
      teams: teams.map((t) => ({
        name: t.name,
        code: t.code,
        purseRemaining: t.purseRemaining,
        playersCount: t.playersCount,
        maxPlayers: t.maxPlayers,
        ownerName: t.ownerName,
      })),
      players: currentPlayer ? [currentPlayer] : [],
      stats,
    };
    exportAuctionPDF(payload, `${auction.name.replace(/\s+/g, '_')}_Results.pdf`);
  };

  const auctionCode = auctionId.slice(-6).toUpperCase();

  const copyCode = () => {
    navigator.clipboard.writeText(auctionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentBiddingTeam = useMemo(() => {
    if (selectedTeamId) {
      return teams.find((t) => t._id === selectedTeamId) || null;
    }
    return session?.selectedTeam || null;
  }, [selectedTeamId, session?.selectedTeam, teams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono text-[#7fa3b0]">Connecting to Live Auction Control Center...</span>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-mono text-rose-400">Auction Workspace Error</h2>
          <p className="text-xs text-[#7fa3b0]">{error || 'Could not load auction session.'}</p>
          <Link
            href={`/admin/auctions/${auctionId}`}
            className="inline-block px-4 py-2 rounded-xl bg-[#031d27] border border-[#0d3f4f] text-[#00d2ee] text-xs font-mono"
          >
            Return to Tournament Arena
          </Link>
        </div>
      </div>
    );
  }

  const isAuctionFinished = session?.status === 'COMPLETED' || (stats.available === 0 && !currentPlayer);

  return (
    <div className="min-h-screen bg-[#02131b] text-white flex flex-col selection:bg-[#00d2ee]/30 font-sans">
      {/* ===================== A. TOP HEADER ===================== */}
      <header className="h-16 border-b border-[#0d3f4f] bg-[#02141e]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-lg">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/admin/auctions/${auctionId}`}
            className="p-2 rounded-xl bg-[#031d27] border border-[#0d3f4f] hover:border-[#00d2ee] text-[#7fa3b0] hover:text-[#00d2ee] transition-all cursor-pointer"
            title="Back to Tournament Arena"
          >
            <IoArrowBackOutline size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-mono font-medium tracking-wide uppercase text-white truncate max-w-xs sm:max-w-md">
                {auction.name}
              </h1>
              {/* Mode Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                  session?.mode === 'LIVE'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-400'
                    : 'bg-[#00d2ee]/15 border-[#00d2ee]/50 text-[#00d2ee]'
                }`}
              >
                {session?.mode === 'LIVE' ? (
                  <>
                    <span className="size-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>Live Mode</span>
                  </>
                ) : (
                  <>
                    <IoDesktopOutline className="size-3" />
                    <span>Normal Mode</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#7fa3b0] font-mono mt-0.5">
              <span>Code:</span>
              <span className="text-[#00d2ee] font-semibold">{auctionCode}</span>
              <button
                type="button"
                onClick={copyCode}
                className="hover:text-[#00d2ee] transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? <IoCheckmarkOutline className="text-emerald-400 size-3" /> : <IoCopyOutline className="size-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions & Connection Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Customized Theme Pill */}
          <div
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border"
            style={{
              backgroundColor: activeTheme.bgLight,
              color: activeTheme.color,
              borderColor: activeTheme.border,
            }}
            title="Active Customized Arena Theme"
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: activeTheme.color }} />
            <span>{activeTheme.label}</span>
          </div>

          {/* Realtime Status Indicator */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            }`}
          >
            <span className={`size-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>{isConnected ? 'Sync Active' : 'Connecting...'}</span>
          </div>

          {/* Tracking History */}
          <button
            type="button"
            onClick={() => setIsTrackingOpen(true)}
            className="p-2 rounded-xl bg-[#031d27] border border-[#0d3f4f] hover:border-[#00d2ee] text-[#7fa3b0] hover:text-[#00d2ee] transition-all cursor-pointer"
            title="Tracking Record"
          >
            <IoTimeOutline size={18} />
          </button>

          {/* Team Player Preview Mode */}
          <button
            type="button"
            onClick={() => setIsTeamPreviewOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#031d27] border border-[#00d2ee]/40 hover:border-[#00d2ee] text-[#00d2ee] text-xs font-mono transition-all cursor-pointer shadow-sm"
            title="Team Player & Squad Roster Preview"
          >
            <IoPeopleOutline size={15} />
            <span>Team Preview</span>
          </button>

          {/* Customized Auction Display Studio */}
          <button
            type="button"
            onClick={() => setIsDisplaySettingsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#031d27] border border-[#00d2ee]/60 hover:border-[#00d2ee] text-[#00d2ee] text-xs font-mono transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,210,238,0.3)]"
            title="Customized Auction Display Studio (Resize, Remove Fields, Colors)"
          >
            <SlidersHorizontal size={14} />
            <span>Customize Display</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#031d27] border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 text-xs font-mono transition-all cursor-pointer shadow-sm"
            title="Export Excel Report"
          >
            <IoDownloadOutline size={14} />
            <span>Excel</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#031d27] border border-[#00d2ee]/40 hover:border-[#00d2ee] text-[#00d2ee] text-xs font-mono transition-all cursor-pointer shadow-sm"
            title="Export PDF Report"
          >
            <IoDocumentTextOutline size={14} />
            <span>PDF</span>
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={actionLoading}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              session?.status === 'PAUSED'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#031d27] border-[#0d3f4f] hover:border-amber-400 text-[#7fa3b0] hover:text-amber-400'
            }`}
            title={session?.status === 'PAUSED' ? 'Resume Session' : 'Pause Session'}
          >
            {session?.status === 'PAUSED' ? <IoPlayOutline size={18} /> : <IoPauseOutline size={18} />}
          </button>
        </div>
      </header>

      {/* Global Alert Notification */}
      {error && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-rose-300">
          <div className="flex items-center gap-2">
            <IoCloseCircleOutline className="size-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ===================== WORKSPACE: EXACT LAYOUT FROM REFERENCE IMAGE ===================== */}
      <div className="flex-1 min-h-0 h-[calc(100vh-4rem)] p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between gap-3 sm:gap-4 bg-[#010e17] overflow-hidden">
        {isAuctionFinished ? (
          /* AUCTION COMPLETED SCREEN */
          <div className="my-auto text-center p-8 space-y-6 max-w-lg mx-auto">
            <div className="size-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#00d2ee]/20 to-emerald-500/20 border-2 border-[#00d2ee] flex items-center justify-center shadow-[0_0_30px_rgba(0,210,238,0.3)]">
              <IoTrophyOutline className="size-10 text-[#00d2ee]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-mono uppercase tracking-wider text-white font-medium">Auction Completed!</h2>
              <p className="text-xs text-[#7fa3b0] leading-relaxed">
                All eligible players have been processed or the session was finalized. Review statistics and download verified tournament reports below.
              </p>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#021824] border border-[#0d3f4f]">
              <div className="text-center">
                <div className="text-xl font-mono text-emerald-400 font-semibold">{stats.sold}</div>
                <div className="text-[10px] font-mono text-[#7fa3b0] uppercase">Sold</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono text-amber-400 font-semibold">{stats.unsold}</div>
                <div className="text-[10px] font-mono text-[#7fa3b0] uppercase">Unsold</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono text-[#00d2ee] font-semibold">{stats.totalSpend.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-[#7fa3b0] uppercase">Total Spent</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500 text-emerald-300 text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <IoDownloadOutline className="size-4" />
                <span>Download Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00d2ee]/20 hover:bg-[#00d2ee]/30 border border-[#00d2ee] text-[#00d2ee] text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <IoDocumentTextOutline className="size-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ================= Top Row: Two Cards (Player Card + Teams Card) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0 items-stretch overflow-hidden">
              {/* 1. LEFT CARD: ACTIVE PLAYER ON BLOCK (DYNAMICALLY SCALED FROM CUSTOMIZED DISPLAY) */}
              <div
                className={`${(ARENA_SPLIT_MAP[arenaSplit] || ARENA_SPLIT_MAP['8-4']).leftClass} bg-[#02131b]/95 border border-[#0d3f4f] rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col justify-between h-full overflow-hidden`}
              >
                {currentPlayer ? (
                  (() => {
                    const custom = (currentPlayer.customFields || {}) as Record<string, any>;
                    const rawAge = custom.age || custom.Age || custom.AgeGroup || custom['Age'] || currentPlayer.experience || '7';
                    const playerAge = String(rawAge).toLowerCase().includes('year') || String(rawAge).toLowerCase().includes('yr') ? String(rawAge) : `${rawAge} Years`;
                    const rawGender = custom.gender || custom.Gender || 'Male';
                    const playerGender = String(rawGender).toLowerCase().startsWith('gender:') ? String(rawGender) : `Gender: ${rawGender}`;
                    const playerGrade = custom.grade || custom.Grade || currentPlayer.role || 'Grade -';
                    const playerCategory = custom.category || custom.Category || currentPlayer.experience || 'Beginner';
                    const playerChapter = custom.chapter || custom.Chapter || custom.city || custom.City || currentPlayer.sport || 'Prime';

                    const cardSplit = CARD_SPLIT_MAP[playerCardSplit] || CARD_SPLIT_MAP['4-8'];
                    const nameFont = NAME_FONT_SIZE_MAP[nameFontSize] || NAME_FONT_SIZE_MAP['2xl'];
                    const bidFont = BID_FONT_SIZE_MAP[bidFontSize] || BID_FONT_SIZE_MAP['2xl'];
                    const snoFont = SNO_FONT_SIZE_MAP[snoFontSize] || SNO_FONT_SIZE_MAP['xl'];
                    const badgesCfg = BADGES_SIZE_MAP[badgesSize] || BADGES_SIZE_MAP['md'];

                    return (
                      <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-stretch h-full ${photoPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                        {/* Sub-Column 1: Player Photo + 2 Pills Directly Underneath */}
                        <div className={`${cardSplit.photoClass} ${photoPosition === 'right' ? 'md:order-2' : 'md:order-1'} flex flex-col justify-between gap-3 h-full`}>
                          <div className={`relative w-full rounded-2xl overflow-hidden bg-[#011420] border-2 border-[#0d3f4f]/80 shadow-md ${
                            photoAspect === 'square' ? 'aspect-square' : photoAspect === 'tall' ? 'aspect-[4/5]' : 'md:flex-1'
                          }`}>
                            <img
                              src={currentPlayer.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600'}
                              alt={currentPlayer.name}
                              className="size-full object-cover"
                            />
                          </div>

                          {/* 2 Pills directly under the photo */}
                          {showPillsUnderPhoto && (
                            <div className="grid grid-cols-2 gap-2.5 shrink-0">
                              <div className="py-2.5 px-3 rounded-xl bg-[#011420] border border-[#0d3f4f] text-center text-xs sm:text-sm font-mono font-bold text-white tracking-wide truncate" title={playerAge}>
                                {playerAge}
                              </div>
                              <div className="py-2.5 px-3 rounded-xl bg-[#011420] border border-[#0d3f4f] text-center text-xs sm:text-sm font-mono font-bold text-white tracking-wide truncate" title={playerGender}>
                                {playerGender}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sub-Column 2: Serial No, Name, Badges, and Huge Current Bid (Dynamic Order) */}
                        <div className={`${cardSplit.detailsClass} ${photoPosition === 'right' ? 'md:order-1' : 'md:order-2'} flex flex-col justify-between py-1 h-full min-w-0`}>
                          <div className="space-y-3 lg:space-y-4">
                            {elementOrder.map((elemId) => {
                              if (elemId === 'sno') {
                                return (
                                  <div
                                    key="sno"
                                    className={`${snoFont.class} font-black font-mono tracking-wide uppercase drop-shadow-[0_0_18px_rgba(0,210,238,0.65)]`}
                                    style={{ color: activeTheme.color }}
                                  >
                                    S.NO #{currentPlayer.playerCode || (currentPlayer as any).order || '95'}
    </div>
                                );
                              }

                              if (elemId === 'name') {
                                return (
                                  <div key="name" className="w-full overflow-hidden mt-1">
                                    <AutoScrollText
                                      text={currentPlayer.name}
                                      className={`${nameFont.class} font-black font-sans uppercase tracking-wider text-white leading-tight`}
                                    />
    </div>
                                );
                              }

                              if (elemId === 'badges') {
                                return (
                                  <div key="badges" className="space-y-1.5 pt-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      {/* Quick minus button */}
                                      <button
                                        type="button"
                                        className="size-9 sm:size-10 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-black flex items-center justify-center text-lg shadow-sm transition-transform active:scale-95 cursor-pointer"
                                        title="Quick tag action"
                                      >
                                        -
                                      </button>

                                      {/* Blue outlined badge: Ribbon Grade Edit */}
                                      <div className={`inline-flex items-center gap-2 rounded-xl bg-[#021c29] border border-[#00d2ee]/60 text-[#00d2ee] font-mono font-bold shadow-sm ${badgesCfg.badgeClass}`}>
                                        <IoPricetagOutline className={badgesCfg.iconClass} />
                                        <span>{playerGrade}</span>
                                        <Pencil className="size-3.5 text-[#00d2ee]/70 ml-0.5" />
        </div>

                                      {/* Category / Experience Badge */}
                                      <div className={`rounded-xl bg-[#78350f]/80 border border-amber-600/50 text-[#fed7aa] font-mono font-bold shadow-[0_0_15px_rgba(217,119,6,0.35)] ${badgesCfg.badgeClass}`}>
                                        {playerCategory}
        </div>

                                      {/* Chapter Badge */}
                                      <div className={`rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 font-mono font-semibold shadow-sm ${badgesCfg.badgeClass}`}>
                                        Chapter: {playerChapter}
        </div>
      </div>
    </div>
                                );
                              }

                              if (elemId === 'bid') {
                                return (
                                  <div key="bid" className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4 shrink-0">
                                    {/* Golden Coin Icon */}
                                    <div className="size-14 sm:size-16 lg:size-18 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border-2 border-yellow-200/90 shadow-[0_0_25px_rgba(245,158,11,0.65)] flex items-center justify-center text-amber-950 font-black shrink-0">
                                      <Landmark className="size-7 sm:size-8 lg:size-9 text-amber-950" />
      </div>

                                    {/* Giant Bid Amount */}
                                    <div
                                      className={`${bidFont.class} font-black font-mono tracking-tight drop-shadow-[0_0_25px_rgba(0,210,238,0.75)] flex-1 min-w-0 truncate`}
                                      style={{ color: activeTheme.color }}
                                    >
                                      {(session?.currentBid || currentPlayer.basePrice).toLocaleString()}
      </div>

                                    {/* Edit pencil button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomPriceInput(String(session?.currentBid || currentPlayer.basePrice));
                                        setSellModalOpen(true);
                                      }}
                                      className="size-11 sm:size-13 rounded-2xl bg-[#031d27] border border-[#00d2ee]/50 hover:border-[#00d2ee] hover:bg-[#00d2ee]/15 text-[#00d2ee] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                      title="Custom Bid / Edit Price"
                                    >
                                      <Pencil className="size-5 sm:size-6" />
                                    </button>

                                    {/* Undo button */}
                                    <button
                                      type="button"
                                      onClick={handleBidDown}
                                      disabled={!currentPlayer || actionLoading}
                                      className="size-11 sm:size-13 rounded-2xl bg-[#031d27] border border-rose-500/50 hover:border-rose-400 hover:bg-rose-500/15 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 disabled:opacity-40"
                                      title="Undo / Decrement Bid"
                                    >
                                      <Undo2 className="size-5 sm:size-6" />
                                    </button>
    </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* EMPTY STATE: READY FOR NEXT PLAYER */
                  <div className="my-auto text-center p-8 space-y-4 max-w-md mx-auto">
                    <div className="size-16 mx-auto rounded-2xl bg-[#031d27] border border-[#0d3f4f] flex items-center justify-center text-[#7fa3b0]">
                      <IoPersonOutline className="size-8 text-[#00d2ee]" />
                    </div>
                    <h3 className="text-xl font-mono uppercase tracking-wider text-white font-medium">Ready on Auction Block</h3>
                    <p className="text-xs sm:text-sm text-[#7fa3b0] leading-relaxed">
                      No player is currently on the auction block. Click <strong>&quot;New Player&quot;</strong> below to draw the next
                      candidate in {selectionMode === 'RANDOM' ? 'Random Mode' : 'Manual Mode'}.
                    </p>
                    <button
                      type="button"
                      onClick={handleNextPlayer}
                      disabled={actionLoading || stats.available === 0}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00d2ee] hover:bg-[#00b8d4] text-[#02131b] text-sm font-mono font-bold shadow-[0_0_20px_rgba(0,210,238,0.4)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <IoFlashOutline className="size-4" />
                      <span>Call Next Player</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. RIGHT CARD: TEAMS (DYNAMICALLY SCALED FROM ARENA SPLIT) */}
              <div
                className={`${(ARENA_SPLIT_MAP[arenaSplit] || ARENA_SPLIT_MAP['8-4']).rightClass} bg-[#02131b]/95 border border-[#0d3f4f] rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col justify-between h-full overflow-hidden`}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#0d3f4f] shrink-0 mb-2">
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-[#00d2ee]">
                      TEAMS ({teams.length})
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase text-amber-500">
                      BIDDING TEAM SELECTION
                    </span>
                  </div>

                  {/* Clean List of Teams (Column Wise Two, Row Wise 3 Fit) */}
                  <div className={`${(TEAMS_COLUMNS_MAP[teamsColumns] || TEAMS_COLUMNS_MAP['2']).gridClass} overflow-y-auto custom-scrollbar pr-0.5 flex-1`}>
                    {teams.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-[#0d3f4f] rounded-2xl col-span-full">
                        <IoPeopleOutline className="size-8 mx-auto text-[#7fa3b0] mb-2" />
                        <p className="text-xs font-mono text-[#7fa3b0]">No teams registered in this auction.</p>
                      </div>
                    ) : (
                      teams.map((team) => {
                        const isSelected = selectedTeamId === team._id;
                        const isLeadingBidder = session?.selectedTeam?._id === team._id;
                        const maxSquad = team.maxPlayers || auction.playersPerTeam || 25;
                        const squadCount = team.playersCount || 0;
                        const isFull = squadCount >= maxSquad;
                        const slotsLeft = Math.max(0, maxSquad - squadCount);
                        const teamCardCfg = TEAM_CARD_SIZE_MAP[teamCardSize] || TEAM_CARD_SIZE_MAP.md;

                        return (
                          <div
                            key={team._id}
                            onClick={() => handleSelectTeam(team)}
                            className={`h-auto w-full self-start shrink-0 ${teamCardCfg.cardPad} rounded-xl border transition-all cursor-pointer relative select-none flex items-center gap-2 ${
                              isSelected
                                ? 'bg-[#00d2ee]/15 border-[#00d2ee] shadow-[0_0_15px_rgba(0,210,238,0.4)] ring-1 ring-[#00d2ee]'
                                : isLeadingBidder
                                ? 'bg-amber-500/10 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : 'bg-[#011622] hover:bg-[#021f30] border-[#0d3f4f] hover:border-[#00d2ee]/50'
                            }`}
                          >
                            {/* Team Logo */}
                            <div className={`${teamCardCfg.logoSize} rounded-full overflow-hidden border border-white/20 bg-[#010e17] shrink-0 flex items-center justify-center`}>
                              <img
                                src={team.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100'}
                                alt={team.name}
                                className="size-full object-cover"
                              />
                            </div>

                            {/* Team Info */}
                            <div className="flex-1 min-w-0">
                              {/* Row 1: Name with AutoScroll + Eye Icon on far right */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex-1 min-w-0 mr-1">
                                  <AutoScrollText
                                    text={team.name}
                                    className={`${teamCardCfg.nameClass} font-sans text-white`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTeamPreviewOpen(true);
                                  }}
                                  className="text-[#7fa3b0] hover:text-[#00d2ee] p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                                  title="View Team Squad Roster"
                                >
                                  <Eye className="size-3" />
                                </button>
                              </div>

                              {/* Row 2: Gold Coin + Purse */}
                              <div className="flex items-center justify-between gap-1 mt-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <div className={`${teamCardCfg.coinSize} rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-yellow-200 flex items-center justify-center shrink-0`}>
                                    <Landmark className="size-2 text-amber-950" />
                                  </div>
                                  <span className={`${teamCardCfg.purseClass} font-mono text-amber-400 truncate`}>
                                    {formatPurseShort(team.purseRemaining)}
                                  </span>
                                </div>
                                {isFull && (
                                  <span className="px-1 rounded text-[8px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase shrink-0">
                                    Full
                                  </span>
                                )}
                              </div>

                              {/* Row 3: Squad 25/25 + Full / Left: X */}
                              <div className={`flex items-center justify-between font-mono mt-0.5 text-[#7fa3b0] ${teamCardCfg.squadClass}`}>
                                <span>Squad: {squadCount}/{maxSquad}</span>
                                <span className={isFull ? 'text-rose-400' : 'text-emerald-400 font-medium'}>
                                  Left: {slotsLeft}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= Bottom Row: Auction Controls & 2x2 Stats Badges - Increased Size ================= */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-2 border-t border-[#0d3f4f]/50 shrink-0">
              {/* Left: Action Control Deck */}
              <div className="w-full lg:w-auto flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* Box: NEW PLAYER MODE */}
                <div className="p-1 sm:p-1.5 rounded-2xl bg-[#011420] border border-[#0d3f4f] flex items-center gap-2 shadow-inner">
                  <div className="flex flex-col px-1.5">
                    <span className="text-[9px] font-mono font-bold text-[#7fa3b0] uppercase tracking-wider text-center">
                      NEW PLAYER MODE
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectionMode('RANDOM')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectionMode === 'RANDOM'
                            ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                            : 'text-[#7fa3b0] hover:text-white'
                        }`}
                      >
                        <Shuffle className="size-3.5" />
                        <span>Random</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode('MANUAL')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectionMode === 'MANUAL'
                            ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                            : 'text-[#7fa3b0] hover:text-white'
                        }`}
                      >
                        <List className="size-3.5" />
                        <span>Manual</span>
                      </button>
                    </div>
                  </div>

                  {/* Solid Orange "New Player" Button */}
                  <button
                    type="button"
                    onClick={handleNextPlayer}
                    disabled={actionLoading || stats.available === 0}
                    className={`rounded-xl bg-[#c25e1a] hover:bg-[#d8691f] text-white font-mono font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${(CONTROLS_SIZE_MAP[controlsSize] || CONTROLS_SIZE_MAP['md']).btnClass}`}
                  >
                    New Player
                  </button>
                </div>

                {/* + Bid Up Button */}
                <button
                  type="button"
                  onClick={handleBidUp}
                  disabled={!currentPlayer || actionLoading}
                  className={`rounded-xl bg-[#031d27] border border-[#00d2ee]/60 hover:border-[#00d2ee] hover:bg-[#00d2ee]/15 text-[#00d2ee] font-mono font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${(CONTROLS_SIZE_MAP[controlsSize] || CONTROLS_SIZE_MAP['md']).btnClass}`}
                >
                  + Bid Up
                </button>

                {/* - Bid Down Button */}
                <button
                  type="button"
                  onClick={handleBidDown}
                  disabled={!currentPlayer || actionLoading}
                  className={`rounded-xl bg-[#031d27] border border-[#00d2ee]/60 hover:border-[#00d2ee] hover:bg-[#00d2ee]/15 text-[#00d2ee] font-mono font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${(CONTROLS_SIZE_MAP[controlsSize] || CONTROLS_SIZE_MAP['md']).btnClass}`}
                >
                  — Bid Down
                </button>

                {/* Vertical divider */}
                <div className="h-8 w-px bg-[#0d3f4f] hidden sm:block" />

                {/* Sold Button */}
                <button
                  type="button"
                  onClick={openSoldDialog}
                  disabled={!currentPlayer || actionLoading}
                  className={`rounded-xl font-mono font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm ${(CONTROLS_SIZE_MAP[controlsSize] || CONTROLS_SIZE_MAP['md']).btnClass} ${
                    selectedTeamId
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-[#031d27] border border-white/20 text-white/50 hover:text-white'
                  } disabled:opacity-40`}
                >
                  <Gavel className="size-4" />
                  <span>Sold</span>
                </button>

                {/* Unsold Button (Vibrant Coral Red) */}
                <button
                  type="button"
                  onClick={handleMarkUnsold}
                  disabled={!currentPlayer || actionLoading}
                  className={`rounded-xl bg-[#ff1744] hover:bg-[#e0143c] text-white font-mono font-bold shadow-[0_0_20px_rgba(255,23,68,0.45)] transition-all cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-40 ${(CONTROLS_SIZE_MAP[controlsSize] || CONTROLS_SIZE_MAP['md']).btnClass}`}
                >
                  <X className="size-4.5" />
                  <span>Unsold</span>
                </button>
              </div>

              {/* Right: 2x2 Metric Badges */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
                {/* Sold 150 (Dark Emerald) */}
                <div className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#142e20] border border-emerald-600/50 text-emerald-400 text-center text-xs sm:text-sm font-mono font-bold shadow-sm min-w-[120px] sm:min-w-[130px]">
                  Sold {stats.sold}
                </div>

                {/* Available 5 (Dark Blue) */}
                <div className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#0c1f30] border border-[#0d3f4f] text-[#7fa3b0] text-center text-xs sm:text-sm font-mono font-bold shadow-sm min-w-[120px] sm:min-w-[130px]">
                  Available {stats.available}
                </div>

                {/* Unsold 24 (Dark Maroon/Burgundy) */}
                <div className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#2e0e18] border border-rose-600/50 text-rose-400 text-center text-xs sm:text-sm font-mono font-bold shadow-sm min-w-[120px] sm:min-w-[130px]">
                  Unsold {stats.unsold}
                </div>

                {/* Team 6 (Dark Slate) */}
                <div className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#162029] border border-white/10 text-white/90 text-center text-xs sm:text-sm font-mono font-bold shadow-sm min-w-[120px] sm:min-w-[130px]">
                  Team {stats.totalTeams || teams.length}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===================== MODALS ===================== */}
      {/* 1. Manual Player Picker Modal */}
      <SelectPlayerModal
        isOpen={isPlayerPickerOpen}
        onClose={() => setIsPlayerPickerOpen(false)}
        players={eligiblePlayers}
        onSelectPlayer={handlePlayerChosen}
        loading={actionLoading}
      />

      {/* 2. Live Tracking Record Modal */}
      <LiveTrackingModal isOpen={isTrackingOpen} onClose={() => setIsTrackingOpen(false)} auctionId={auctionId} />

      {/* 2b. Customized Display & Team Player Preview Modal */}
      <PlayerDisplaySettingsModal
        isOpen={isTeamPreviewOpen || isDisplaySettingsOpen}
        onClose={() => {
          setIsTeamPreviewOpen(false);
          setIsDisplaySettingsOpen(false);
        }}
        auctionId={auctionId}
        auctionTitle={(auction as any)?.title || auction?.name || 'AUCTION ARENA'}
        roomCode={(auction as any)?.code || (auction as any)?.roomCode || (auction as any)?.slug || 'A21F00'}
        initialPreviewTarget={isTeamPreviewOpen ? 'team' : 'overall'}
        onSaved={async () => {
          try {
            const freshState = await getAuctionSessionState(auctionId);
            setSessionState(freshState);
          } catch (err) {
            console.error('Failed to reload session state after display save:', err);
          }
        }}
      />

      {/* 3. Confirm Sold Dialog */}
      {sellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#011428] border border-[#0d3f4f] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-mono uppercase tracking-wider text-white font-medium">Confirm Player Sale</h3>
            <p className="text-xs text-[#7fa3b0]">
              Assign <strong>{currentPlayer?.name}</strong> to team{' '}
              <strong className="text-[#00d2ee]">{currentBiddingTeam?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-mono text-[#7fa3b0] uppercase mb-1">Winning Price (Points)</label>
              <input
                type="number"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-white bg-[#021824] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSellModalOpen(false)}
                className="px-4 py-2 text-xs font-mono text-[#7fa3b0] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
              >
                <IoCheckmarkDoneOutline className="size-4" />
                <span>Confirm Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Live Bid Ticker Strip */}
      {showBidTicker && (
        <div className="w-full bg-[#011420] border-t border-[#0d3f4f] px-4 py-2 flex items-center gap-3 overflow-hidden text-xs font-mono">
          <span className="shrink-0 flex items-center gap-1.5 font-bold" style={{ color: activeTheme.color }}>
            <span className="size-2 rounded-full animate-ping" style={{ backgroundColor: activeTheme.color }} />
            LIVE TICKER:
          </span>
          <div className="flex-1 truncate text-[#7fa3b0]">
            {currentPlayer ? (
              <span>
                On Block: <strong className="text-white">{currentPlayer.name}</strong> &bull; Base: ₹{(currentPlayer.basePrice || 0).toLocaleString()} &bull; Current Bid: <strong style={{ color: activeTheme.color }}>₹{(session?.currentBid || currentPlayer.basePrice || 0).toLocaleString()}</strong>
                {currentBiddingTeam && <span> &bull; Leading: <strong className="text-white">{currentBiddingTeam.name}</strong></span>}
              </span>
            ) : (
              <span>Session active &bull; {stats.available} eligible athletes waiting in tournament pool</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveAuctionWrapper({ params }: PageProps) {
  const unwrappedParams = use(params);
  return <LiveAuctionControlContent auctionId={unwrappedParams.id} />;
}

export default function LiveAuctionControlPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02131b] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-[#7fa3b0]">Connecting to Auction Arena...</span>
          </div>
        </div>
      }
    >
      <LiveAuctionWrapper params={params} />
    </Suspense>
  );
}
