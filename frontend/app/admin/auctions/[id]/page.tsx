'use client';

import React, { Suspense, useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  IoArrowBackOutline,
  IoShareSocialOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoRadioOutline,
  IoPlayOutline,
  IoAddOutline,
  IoSettingsOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoShieldCheckmarkOutline,
  IoGlobeOutline,
  IoLockClosedOutline,
  IoCopyOutline,
  IoLogoWhatsapp,
  IoMailOutline,
  IoStarOutline,
  IoPricetagOutline,
  IoPeopleOutline,
  IoConstructOutline,
  IoAirplaneOutline,
  IoKeyOutline,
  IoPersonOutline,
  IoColorPaletteOutline,
  IoDesktopOutline,
  IoTvOutline,
  IoSparklesOutline,
  IoFlashOutline,
  IoEyeOutline,
} from 'react-icons/io5';

import {
  Auction,
  Team,
  Player,
  Sponsor,
} from '@/types/auction';
import {
  getAuctionById,
  getTeams,
  getPlayers,
  getSponsors,
  deleteTeam,
  deletePlayer,
  deleteSponsor,
  getCurrentUser,
  getStoredToken,
  startAuctionSession,
} from '@/lib/api';

import { AddTeamModal } from '@/components/auction-profile/AddTeamModal';
import { AddPlayerModal } from '@/components/auction-profile/AddPlayerModal';
import {
  PlayerDisplaySettingsModal,
  THEME_PRESETS,
  AVATAR_SIZE_MAP,
  FONT_SIZE_MAP,
  CARD_SCALE_MAP,
  type AvatarSizeId,
  type FontSizeId,
  type CardScaleId,
  type FieldColumnsId,
} from '@/components/auction-profile/PlayerDisplaySettingsModal';
import { AddSponsorModal } from '@/components/auction-profile/AddSponsorModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TeamFormOverrideModal } from '@/components/auction-profile/TeamFormOverrideModal';
import { LiveTrackingModal } from '@/components/auction-profile/LiveTrackingModal';
import { ShareAuctionDialog } from '@/components/admin/ShareAuctionDialog';
import { StartAuctionModeDialog } from '@/components/auction/StartAuctionModeDialog';

type TabKey = 'teams' | 'players' | 'display' | 'mvp' | 'sponsors' | 'link' | 'about';

interface PageProps {
  params: Promise<{ id: string }>;
}

function AuctionProfileContent({ id }: { id: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('teams');

  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
  const [displayPreviewTarget, setDisplayPreviewTarget] = useState<'overall' | 'player' | 'team'>('overall');
  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedTeamForOverride, setSelectedTeamForOverride] = useState<Team | null>(null);
  const [isStartModeOpen, setIsStartModeOpen] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Copy indicator
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleConfirmStartAuction = async (mode: 'NORMAL' | 'LIVE') => {
    try {
      setIsStartingSession(true);
      const token = getStoredToken() || undefined;
      await startAuctionSession(id, mode, 'RANDOM', token);
      router.push(`/admin/auctions/${id}/live?mode=${mode}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start auction session');
    } finally {
      setIsStartingSession(false);
      setIsStartModeOpen(false);
    }
  };

  useEffect(() => {
    async function loadAuctionProfile() {
      try {
        setLoading(true);
        setError(null);
        const token = getStoredToken() || '';

        // Check if user is admin
        const user = await getCurrentUser(token);
        setCurrentUser(user);
        if (!user || user.role !== 'ADMIN') {
          // If not admin, redirect or show message
        }

        const [auctionRes, teamsRes, playersRes, sponsorsRes] = await Promise.all([
          getAuctionById(id, token),
          getTeams(id),
          getPlayers(id),
          getSponsors(id),
        ]);

        if (!auctionRes.success || !auctionRes.data) {
          setError(auctionRes.message || 'Auction not found');
          return;
        }

        setAuction(auctionRes.data);
        setTeams(teamsRes);
        setPlayers(playersRes);
        setSponsors(sponsorsRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load auction profile');
      } finally {
        setLoading(false);
      }
    }

    loadAuctionProfile();
  }, [id]);

  const refreshAuction = async () => {
    try {
      const token = getStoredToken() || '';
      const [auctionRes, teamsRes, playersRes, sponsorsRes] = await Promise.all([
        getAuctionById(id, token),
        getTeams(id),
        getPlayers(id),
        getSponsors(id),
      ]);
      if (auctionRes.success && auctionRes.data) {
        setAuction(auctionRes.data);
      }
      setTeams(teamsRes);
      setPlayers(playersRes);
      setSponsors(sponsorsRes);
    } catch (err) {
      console.error('Failed to refresh auction profile:', err);
    }
  };

  // Handle Export Excel / CSV
  const handleExportCSV = () => {
    if (!auction) return;
    const rows = [
      ['Auction Name', auction.name],
      ['Sport', auction.sport],
      ['Scheduled At', auction.scheduledAt],
      ['Total Teams', teams.length.toString()],
      ['Total Players', players.length.toString()],
      [],
      ['TEAM ROSTER REPORT'],
      ['Team Name', 'Team Code', 'Owner', 'Purse Total', 'Purse Remaining', 'Players Count'],
      ...teams.map((t) => [
        t.name,
        t.code,
        t.ownerName || 'N/A',
        t.purseTotal.toString(),
        t.purseRemaining.toString(),
        t.playersCount.toString(),
      ]),
      [],
      ['PLAYER CATALOG REPORT'],
      ['Player Name', 'Role', 'Email', 'Base Price', 'Status', 'Assigned Team'],
      ...players.map((p) => [
        p.name,
        p.role,
        p.email,
        p.basePrice.toString(),
        p.status,
        typeof p.teamId === 'object' && p.teamId ? (p.teamId as any).name : 'Pool',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${auction.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011428] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#0466c8] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-normal text-white/60">Loading auction profile...</span>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-[#011428] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4">
          <p className="text-sm font-normal text-red-400">{error || 'Auction not found'}</p>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
          >
            <IoArrowBackOutline /> Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  const auctionCode = auction._id ? auction._id.slice(-6).toLowerCase() : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const publicAuctionUrl = `${origin}/auctions/${auction._id}`;
  const teamRegistrationUrl = `${origin}/auctions/${auction._id}?register=team`;
  const playerRegistrationUrl = `${origin}/auctions/${auction._id}?register=player`;

  // Formatted date and time
  const dateObj = new Date(auction.scheduledAt);
  const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
  const formattedTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  const isLive = auction.status === 'LIVE';
  const isDraft = auction.status === 'DRAFT';
  const statusBadgeText = isLive ? 'LIVE TOURNAMENT' : isDraft ? 'DRAFT TOURNAMENT' : `${auction.status} TOURNAMENT`;
  const startedStatusText = isLive ? 'Started' : isDraft ? 'Draft' : 'Scheduled';

  return (
    <div className="min-h-screen bg-[#02131b] text-white flex flex-col relative selection:bg-[#00d2ee]/30 selection:text-white">
      {/* ===================== TOP NAVBAR (NORMAL UPDATE) ===================== */}
      <header className="w-full border-b border-[#0d3f4f]/80 bg-[#02131b]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/auctions"
            className="p-1.5 rounded-lg text-[#7fa3b0] hover:text-[#00d2ee] hover:bg-[#031d27] transition-colors"
            title="Back to Auctions"
          >
            <IoArrowBackOutline size={20} />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/AOTMS__logo.png"
              alt="AOTMS Logo"
              width={110}
              height={32}
              className="object-contain h-7 w-auto filter drop-shadow-[0_0_8px_rgba(0,210,238,0.3)]"
              priority
            />
          </Link>
          <div className="h-4 w-px bg-[#0d3f4f] hidden sm:block" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#7fa3b0] hidden sm:inline">
            Tournament Arena
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-[#8ab6c4] hover:text-[#00d2ee] px-3 py-1.5 rounded-lg hover:bg-[#051c24] transition-colors"
          >
            Home
          </Link>

          <Link
            href="/auctions"
            className="text-xs text-[#8ab6c4] hover:text-[#00d2ee] px-3 py-1.5 rounded-lg hover:bg-[#051c24] transition-colors"
          >
            Auctions
          </Link>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-xl bg-[#031d27] hover:bg-[#052735] border border-[#0d3f4f] hover:border-[#00d2ee] text-[#7fa3b0] hover:text-[#00d2ee] transition-all cursor-pointer shadow-sm"
            title="Share Auction"
          >
            <IoShareSocialOutline size={16} />
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 bg-[#051c24] border border-[#0d3b4b] rounded-full px-3 py-1 text-xs">
              <img
                src={currentUser.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                alt={currentUser.name}
                className="size-5 rounded-full object-cover border border-[#00d2ee]"
              />
              <span className="text-[#e2f1f6] hidden sm:inline">{currentUser.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* ===================== HERO SECTION: STADIUM FLOODLIGHTS BANNER ===================== */}
      <div className="relative w-full overflow-hidden border-b border-[#0d3f4f] bg-[#02131b]">
        {/* Stadium Floodlights Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/stadium-band.jpg"
            alt="Stadium Arena"
            fill
            priority
            className="object-cover object-center opacity-65 saturate-150 brightness-95"
          />
          {/* Cyan/Night gradient overlay: allows stadium lights to glow on edges while keeping text ultra crisp */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#02131b]/60 via-[#02141d]/85 to-[#021118]" />
        </div>

        <div className="relative z-10 max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
            {/* Left: Square Tournament Poster */}
            <div className="relative size-28 sm:size-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#00d2ee] shadow-[0_0_25px_rgba(0,210,238,0.4)] shrink-0 bg-[#021822]">
              <Image
                src={auction.image?.url || '/stadium-band.jpg'}
                alt={auction.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Right: Tournament Information & Details */}
            <div className="flex-1 space-y-2.5 min-w-0">
              {/* 1. Status Pill Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#00d2ee]/60 bg-[#00d2ee]/15 text-[#00d2ee] text-[11px] font-mono font-semibold tracking-wider uppercase">
                  <span
                    className={`size-2 rounded-full ${
                      isLive ? 'bg-rose-500 animate-ping' : isDraft ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{statusBadgeText}</span>
                </span>
              </div>

              {/* 2. Bold Uppercase Monospace Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-wider text-white uppercase break-words">
                {auction.name}
              </h1>

              {/* 3. Auction Code Row */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#7fa3b0]">
                <span>Auction Code:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-[#00d2ee]/70 bg-[#00d2ee]/20 text-[#00d2ee] font-mono text-xs font-semibold">
                  {auctionCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(auctionCode, 'code')}
                  className="p-1 text-[#7fa3b0] hover:text-[#00d2ee] transition-colors cursor-pointer"
                  title="Copy auction code"
                >
                  {copiedLink === 'code' ? (
                    <IoCheckmarkCircleOutline className="size-4 text-emerald-400" />
                  ) : (
                    <IoCopyOutline className="size-4" />
                  )}
                </button>
              </div>

              {/* 4. Schedule Date & Time Row */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#7fa3b0]">
                <IoCalendarOutline className="size-4 text-[#00d2ee]" />
                <span>
                  {formattedDate}, {formattedTime}
                </span>
              </div>

              {/* 5. Meta Statistics Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#7fa3b0]">
                <span className="flex items-center gap-1.5">
                  <IoPeopleOutline className="size-4 text-[#00d2ee]" />
                  <span>{auction.playersPerTeam || 13} Player Per Team</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IoPersonOutline className="size-4 text-[#00d2ee]" />
                  <span>{players.length} Registered</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IoTimeOutline className="size-4 text-[#00d2ee]" />
                  <span>{startedStatusText}</span>
                </span>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* 1. Auction Result Excel */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  <IoDownloadOutline className="size-3.5" />
                  <span>Auction Result Excel</span>
                </button>

                {/* 2. Auction Result PDF */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#00d2ee]/70 bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 text-[#00d2ee] text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  <IoDocumentTextOutline className="size-3.5" />
                  <span>Auction Result PDF</span>
                </button>

                {/* 3. Role:Admin -> Customized Form */}
                {(currentUser?.role === 'ADMIN' || auction.ownerId?._id === currentUser?.id) && (
                  <Link
                    href={`/admin/auctions/${auction._id}/form-builder`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-violet-500/70 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <IoConstructOutline className="size-3.5" />
                    <span>Customized Form</span>
                  </Link>
                )}

                {/* 3.5 Role:Admin -> Customized Display */}
                {(currentUser?.role === 'ADMIN' || auction.ownerId?._id === currentUser?.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayPreviewTarget('overall');
                      setIsDisplaySettingsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#00d2ee]/70 bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 text-[#00d2ee] text-xs font-medium transition-all shadow-sm cursor-pointer"
                    title="Customize Theme, Card Layout & Live Arena Preview"
                  >
                    <IoColorPaletteOutline className="size-3.5" />
                    <span>Customized Display</span>
                  </button>
                )}

                {/* 4. Start Auction */}
                <button
                  type="button"
                  onClick={() => setIsStartModeOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(244,63,94,0.65)] transition-all cursor-pointer"
                >
                  <span className="size-2 rounded-full bg-white animate-pulse" />
                  <span>Start Auction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MIDDLE NAVIGATION TABS BAR (RESPONSIVE) ===================== */}
      <div className="w-full border-b border-[#0d3f4f] bg-[#02131b]/95 backdrop-blur-md sticky top-[57px] z-30 shadow-lg">
        <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollArea className="w-full">
            <nav className="flex items-center gap-6 sm:gap-10 py-1">
              {(
                [
                  { key: 'teams', label: `TEAMS (${teams.length})` },
                  { key: 'players', label: `PLAYERS (${players.length})` },
                  { key: 'display', label: 'DISPLAY UI DESIGN' },
                  { key: 'mvp', label: 'MVP LEADERBOARD' },
                  { key: 'sponsors', label: `SPONSORS (${sponsors.length})` },
                  { key: 'link', label: 'REGISTRATION LINKS' },
                  { key: 'about', label: 'RULES & ABOUT' },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-3 text-xs sm:text-sm font-mono tracking-wider uppercase font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                      isActive
                        ? 'text-[#00d2ee] border-[#00d2ee]'
                        : 'text-white/60 hover:text-white border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <ScrollBar orientation="horizontal" className="h-1 bg-transparent" />
          </ScrollArea>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-[1720px] 2xl:max-w-[1880px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ===================== TAB CONTENT AREA ===================== */}
        <div className="mt-6 flex-1">
          {/* Quick Display UI Indicator Banner */}
          {(() => {
            const layout = auction.displayLayout || {};
            const themeId = layout.themeColor || 'cyan';
            const activeTheme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
            const cardLayout = layout.cardLayout || 'stadium';
            const layoutNames: Record<string, string> = {
              stadium: 'Stadium Big Screen',
              broadcast: 'Broadcast TV Overlay',
              modern: 'Minimalist Modern',
            };

            return (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#021824]/90 border border-[#0d3f4f] text-xs font-mono shadow-md backdrop-blur-sm">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[#7fa3b0] flex items-center gap-1.5 font-medium">
                    <IoColorPaletteOutline className="size-4 text-[#00d2ee]" />
                    <span>Active Display UI:</span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px]"
                    style={{
                      backgroundColor: activeTheme.bgLight,
                      color: activeTheme.color,
                      borderColor: activeTheme.border,
                    }}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: activeTheme.color }} />
                    <span className="font-semibold">{activeTheme.label}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#011420] text-[#7fa3b0] border border-[#0d3f4f] text-[11px]">
                    {layoutNames[cardLayout] || 'Stadium Big Screen'}
                  </span>
                  {layout.customTagline && (
                    <span className="hidden sm:inline-block text-white/50 truncate max-w-xs text-[11px]">
                      &bull; &ldquo;{layout.customTagline}&rdquo;
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('display')}
                    className="text-[11px] text-[#7fa3b0] hover:text-white transition-colors cursor-pointer"
                  >
                    View Design Details &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDisplaySettingsOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#00d2ee]/15 hover:bg-[#00d2ee]/25 border border-[#00d2ee]/40 text-[#00d2ee] text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <IoSparklesOutline className="size-3.5" />
                    <span>Customize Display</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 1. TEAMS TAB */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-white">Franchise Teams ({teams.length})</h3>
                  <p className="text-xs font-normal text-white/50">
                    Manage participating teams and set team-specific custom form fields (e.g. Team A vs Team B).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayPreviewTarget('team');
                      setIsDisplaySettingsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium text-[#00d2ee] bg-[#00d2ee]/15 hover:bg-[#00d2ee]/25 border border-[#00d2ee]/40 rounded-xl transition-all cursor-pointer shadow-sm"
                    title="Team Player & Squad Roster Preview Mode"
                  >
                    <IoPeopleOutline size={15} />
                    <span>Team Player Preview</span>
                  </button>
                  <button
                    onClick={() => setIsAddTeamOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <IoAddOutline size={16} />
                    <span>+ New Team</span>
                  </button>
                </div>
              </div>

              {teams.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <p className="text-sm font-normal text-white/40">No franchise teams added yet.</p>
                  <button
                    onClick={() => setIsAddTeamOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-colors"
                  >
                    <IoAddOutline size={16} /> + New Team
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => {
                    const purseUsedPercent = Math.min(
                      100,
                      Math.round(((team.purseTotal - team.purseRemaining) / (team.purseTotal || 1)) * 100)
                    );

                    return (
                      <div
                        key={team._id}
                        className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 transition-all space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                              <Image
                                src={team.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200'}
                                alt={team.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-white">{team.name}</h4>
                              <span className="text-[11px] font-normal text-white/50">{team.code} • {team.ownerName || 'No Owner'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedTeamForOverride(team)}
                              title="Customize Form for this Team (Team A vs Team B)"
                              className="p-1.5 text-white/60 hover:text-[#87c2fd] hover:bg-[#0466c8]/20 rounded-lg transition-colors"
                            >
                              <IoSettingsOutline size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete team ${team.name}?`)) {
                                  const token = getStoredToken() || '';
                                  await deleteTeam(auction._id, team._id, token);
                                  setTeams((prev) => prev.filter((t) => t._id !== team._id));
                                }
                              }}
                              title="Delete Team"
                              className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <IoTrashOutline size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Purse details */}
                        <div className="space-y-1.5 text-xs font-normal">
                          <div className="flex justify-between text-white/60">
                            <span>Remaining Purse:</span>
                            <span className="font-medium text-white">₹{team.purseRemaining.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-[#0466c8] transition-all"
                              style={{ width: `${100 - purseUsedPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-white/40 pt-0.5">
                            <span>Slots: {team.playersCount} / {team.maxPlayers}</span>
                            <span>Total: ₹{team.purseTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Team Form Override Action Button */}
                        <div className="pt-2 border-t border-white/5">
                          <button
                            onClick={() => setSelectedTeamForOverride(team)}
                            className="w-full py-1.5 px-3 rounded-lg text-xs font-normal text-[#87c2fd] hover:text-white bg-[#0466c8]/10 hover:bg-[#0466c8]/20 border border-[#0466c8]/20 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <IoSettingsOutline size={13} />
                            <span>Customize Fields & Payments</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. PLAYERS TAB */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-white">Registered Players ({players.length})</h3>
                  <p className="text-xs font-normal text-white/50">
                    Player catalog, bidding pool, status updates, and custom dynamic attributes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDisplaySettingsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    title="Configure Visible Fields on Player Display Card"
                  >
                    <IoSettingsOutline size={15} />
                    <span>Display Settings</span>
                  </button>
                  <button
                    onClick={() => setIsAddPlayerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-all shadow-md"
                  >
                    <IoAddOutline size={16} />
                    <span> New Player</span>
                  </button>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <p className="text-sm font-normal text-white/40">No players registered in this auction yet.</p>
                  <button
                    onClick={() => setIsAddPlayerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-colors"
                  >
                    <IoAddOutline size={16} /> + New Player
                  </button>
                </div>
              ) : (
                <ScrollArea className="w-full rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 bg-white/[0.02]">
                        <th className="py-3 px-4 font-normal">Player</th>
                        <th className="py-3 px-4 font-normal">Role</th>
                        <th className="py-3 px-4 font-normal">Base Price</th>
                        <th className="py-3 px-4 font-normal">Status</th>
                        <th className="py-3 px-4 font-normal">Franchise</th>
                        <th className="py-3 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {players.map((player) => (
                        <tr key={player._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                                <Image
                                  src={player.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                                  alt={player.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-medium text-white block">{player.name}</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-normal text-white/40">{player.email}</span>
                                  {(() => {
                                    const custom = player.customFields || {};
                                    const visibleKeys = (auction as any)?.displayLayout?.visibleFields;
                                    if (!visibleKeys || !Array.isArray(visibleKeys) || visibleKeys.length === 0) return null;
                                    const matched = Object.entries(custom).filter(([k, v]) => {
                                      if (['playerName', 'playerEmail', 'playerPhone', 'basePrice', 'sport', 'role', 'profileImage', 'name', 'email', 'phone'].includes(k)) return false;
                                      if (typeof v === 'string' && v.startsWith('data:image')) return false;
                                      return visibleKeys.includes(k) && v !== null && v !== undefined && v !== '';
                                    });
                                    if (matched.length === 0) return null;
                                    return (
                                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                        {matched.map(([k, v]) => (
                                          <span key={k} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                            {k.replace(/_/g, ' ')}: {String(v)}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white/80 font-normal">{player.role}</td>
                          <td className="py-3 px-4 font-medium text-white">₹{player.basePrice.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-normal ${
                                player.status === 'SOLD'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : player.status === 'APPROVED'
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                  : 'bg-white/10 text-white/60 border border-white/10'
                              }`}
                            >
                              {player.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white/60 font-normal">
                            {typeof player.teamId === 'object' && player.teamId
                              ? (player.teamId as any).name
                              : 'In Pool'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`Remove ${player.name} from catalog?`)) {
                                  const token = getStoredToken() || '';
                                  await deletePlayer(auction._id, player._id, token);
                                  setPlayers((prev) => prev.filter((p) => p._id !== player._id));
                                }
                              }}
                              className="p-1 text-white/40 hover:text-red-400 transition-colors"
                              title="Delete player"
                            >
                              <IoTrashOutline size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              )}
            </div>
          )}

          {/* 3. DISPLAY UI DESIGN TAB */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#021824] via-[#022137] to-[#021824] border border-[#0d3f4f]">
                <div>
                  <div className="flex items-center gap-2">
                    <IoColorPaletteOutline className="size-5 text-[#00d2ee]" />
                    <h3 className="text-base font-mono font-medium text-white uppercase tracking-wider">
                      Customized Auction Display UI Design
                    </h3>
                  </div>
                  <p className="text-xs font-normal text-[#7fa3b0] mt-1">
                    Live arena visual presentation, broadcast overlay engine, and custom athlete card setup.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayPreviewTarget('overall');
                      setIsDisplaySettingsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#00d2ee] bg-[#00d2ee]/15 hover:bg-[#00d2ee]/25 border border-[#00d2ee]/50 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <IoColorPaletteOutline size={15} />
                    <span>Open Display Studio & Preview</span>
                  </button>
                  <Link
                    href={`/admin/auctions/${auction._id}/live`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-white bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 rounded-xl transition-all shadow-sm"
                  >
                    <IoPlayOutline size={15} />
                    <span>Enter Live Arena</span>
                  </Link>
                </div>
              </div>

              {/* Display Attributes Cards */}
              {(() => {
                const layout = auction.displayLayout || {};
                const themeId = layout.themeColor || 'cyan';
                const activeTheme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
                const cardLayout = layout.cardLayout || 'stadium';
                const backgroundStyle = layout.backgroundStyle || 'dark_arena';
                const customTagline = layout.customTagline || 'OFFICIAL LIVE AUCTION ARENA';
                const showSponsors = layout.showSponsors !== false;
                const showTeamPurses = layout.showTeamPurses !== false;
                const showBidTicker = layout.showBidTicker !== false;
                const showSoundEffects = layout.showSoundEffects !== false;
                const visibleFields = layout.visibleFields || [];

                const avatarSize = (layout.avatarSize || 'md') as AvatarSizeId;
                const fontSize = (layout.fontSize || 'md') as FontSizeId;
                const cardScale = (layout.cardScale || 'normal') as CardScaleId;
                const fieldColumns = (layout.fieldColumns || '2') as FieldColumnsId;

                const avatarConfig = AVATAR_SIZE_MAP[avatarSize] || AVATAR_SIZE_MAP.md;
                const fontConfig = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP.md;
                const cardScaleConfig = CARD_SCALE_MAP[cardScale] || CARD_SCALE_MAP.normal;

                const layoutNames: Record<string, string> = {
                  stadium: 'Stadium Big Screen',
                  broadcast: 'Broadcast TV Overlay',
                  modern: 'Minimalist Modern',
                };

                const bgNames: Record<string, string> = {
                  stadium_floodlights: 'Arena Floodlights',
                  cyber_grid: 'Dark Cyber Grid',
                  dark_arena: 'Dark Arena Deep',
                  gradient: 'Atmosphere Gradient',
                };

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 1. Theme Card */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7fa3b0] block">
                          Active Theme Preset
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-4 rounded-full border shadow-sm"
                            style={{
                              backgroundColor: activeTheme.color,
                              borderColor: activeTheme.border,
                              boxShadow: `0 0 10px ${activeTheme.glow}`,
                            }}
                          />
                          <span className="text-sm font-mono font-medium text-white">{activeTheme.label}</span>
                        </div>
                        <span className="text-[11px] font-mono text-white/40 block">
                          Accent: {activeTheme.color}
                        </span>
                      </div>

                      {/* 2. Layout Mode Card */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7fa3b0] block">
                          Card & Arena Layout
                        </span>
                        <div className="flex items-center gap-2">
                          <IoDesktopOutline className="size-4 text-[#00d2ee]" />
                          <span className="text-sm font-mono font-medium text-white">
                            {layoutNames[cardLayout] || 'Stadium Big Screen'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-white/40 block">
                          Ambience: {bgNames[backgroundStyle] || 'Dark Arena'}
                        </span>
                      </div>

                      {/* 3. Screen Widgets */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7fa3b0] block">
                          Enabled Arena Widgets
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${showSponsors ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'}`}>
                            Sponsors
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${showTeamPurses ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'}`}>
                            Purses
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${showBidTicker ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'}`}>
                            Ticker
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${showSoundEffects ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'}`}>
                            Audio
                          </span>
                        </div>
                      </div>

                      {/* 4. Custom Tagline */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7fa3b0] block">
                          Broadcast Tagline
                        </span>
                        <div className="text-xs font-mono text-white font-medium truncate">
                          {customTagline}
                        </div>
                        <span className="text-[11px] font-mono text-white/40 block">
                          {visibleFields.length} Custom Fields Enabled
                        </span>
                      </div>
                    </div>

                    {/* Visible Fields Showcase */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#7fa3b0]">
                          Configured Visible Athlete Fields ({visibleFields.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDisplaySettingsOpen(true)}
                          className="text-[11px] font-mono text-[#00d2ee] hover:underline cursor-pointer"
                        >
                          Modify visible fields
                        </button>
                      </div>
                      {visibleFields.length === 0 ? (
                        <p className="text-xs text-white/40 font-mono">
                          Default system fields (Role, Base Price, Experience) are currently shown. Open Display Studio to toggle custom registration fields.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {visibleFields.map((fieldKey: string) => (
                            <span
                              key={fieldKey}
                              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#031d27] border border-[#0d3f4f] text-[#e2f1f6] capitalize"
                            >
                              {fieldKey.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                      {/* Live Design Interactive Showcase Mock */}
                    <div className="p-6 rounded-3xl bg-[#02131b] border border-[#0d3f4f] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <IoSparklesOutline className="size-4" style={{ color: activeTheme.color }} />
                          <h4 className="text-sm font-mono uppercase tracking-wider text-white">
                            Live Arena Card Preview (Applied)
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDisplayPreviewTarget('team');
                              setIsDisplaySettingsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono text-white transition-all cursor-pointer shadow-sm"
                            title="Open Team Player Preview"
                          >
                            <IoPeopleOutline size={14} />
                            <span>Team Player Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDisplayPreviewTarget('player');
                              setIsDisplaySettingsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                            style={{
                              backgroundColor: activeTheme.color,
                              color: '#02131b',
                            }}
                          >
                            <IoSparklesOutline size={14} />
                            <span>Customize Display</span>
                          </button>
                        </div>
                      </div>

                      {/* Rendered Mock Player Card */}
                      <div
                        className="p-5 sm:p-6 rounded-2xl border transition-all"
                        style={{
                          borderColor: activeTheme.border,
                          boxShadow: `0 0 25px ${activeTheme.glow}`,
                          background: 'linear-gradient(135deg, rgba(2,24,36,0.95), rgba(1,20,32,0.95))',
                        }}
                      >
                        {customTagline && (
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase font-semibold mb-3 border"
                            style={{
                              backgroundColor: activeTheme.bgLight,
                              color: activeTheme.color,
                              borderColor: activeTheme.border,
                            }}
                          >
                            <IoFlashOutline className="size-3" />
                            <span>{customTagline}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                          <div
                            className={`relative ${avatarConfig.class} rounded-2xl overflow-hidden border-2 shrink-0 bg-[#011420] transition-all`}
                            style={{
                              borderColor: activeTheme.border,
                              boxShadow: `0 0 15px ${activeTheme.glow}`,
                            }}
                          >
                            <img
                              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"
                              alt="Player Mock"
                              className="size-full object-cover"
                            />
                          </div>

                          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border"
                                style={{
                                  backgroundColor: activeTheme.bgLight,
                                  color: activeTheme.color,
                                  borderColor: activeTheme.border,
                                }}
                              >
                                {auction.sport}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-mono font-semibold uppercase">
                                All-Rounder
                              </span>
                            </div>

                            <h3 className={`${fontConfig.nameClass} font-mono uppercase tracking-wider text-white font-medium`}>
                              Demo Star Player
                            </h3>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 max-w-sm">
                              <div className="p-2 rounded-xl bg-[#011420] border border-[#0d3f4f]">
                                <span className="text-[#7fa3b0] block text-[9px] uppercase">Base Price</span>
                                <span className="text-sm text-emerald-400 font-semibold">
                                  {auction.minimumBid.toLocaleString()} pts
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-[#011420] border border-[#0d3f4f]">
                                <span className="text-[#7fa3b0] block text-[9px] uppercase">Experience</span>
                                <span className="text-sm text-[#e2f1f6] font-semibold">3-5 Yrs</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* DOWN SIDE: CURRENT BID (OVERALL CONTENT FINISH DOWN MIDDLE CENTER) */}
                        <div
                          className="mt-6 w-full p-4 sm:p-5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all"
                          style={{
                            borderColor: activeTheme.border,
                            boxShadow: `0 0 25px ${activeTheme.glow}`,
                            background: 'linear-gradient(180deg, rgba(2, 24, 36, 0.95) 0%, rgba(1, 14, 22, 0.95) 100%)',
                          }}
                        >
                          <span className="text-[11px] font-mono uppercase tracking-widest text-[#7fa3b0] font-semibold block mb-1">
                            Current Bid
                          </span>
                          <div
                            className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-tight my-0.5"
                            style={{ color: activeTheme.color }}
                          >
                            {auction.minimumBid.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-mono text-[#7fa3b0] tracking-widest uppercase font-semibold">
                            POINTS
                          </span>
                          <div
                            className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-semibold shadow-sm"
                            style={{
                              backgroundColor: activeTheme.bgLight,
                              borderColor: activeTheme.border,
                              color: activeTheme.color,
                            }}
                          >
                            <span className="size-2 rounded-full animate-ping" style={{ backgroundColor: activeTheme.color }} />
                            <span>Royal Strikers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. MVP TAB */}
          {activeTab === 'mvp' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-white">MVP & Star Performers</h3>
                <p className="text-xs font-normal text-white/50">
                  Highest valued players and key match winners in the tournament pool.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.slice(0, 3).map((player, idx) => (
                  <div
                    key={player._id}
                    className="p-5 rounded-2xl bg-gradient-to-b from-[#022950]/40 to-white/[0.01] border border-white/10 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <IoStarOutline size={12} /> Rank #{idx + 1}
                      </span>
                      <span className="text-xs font-normal text-white/40">{player.role}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        <Image
                          src={player.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{player.name}</h4>
                        <span className="text-xs font-normal text-[#87c2fd]">
                          Valuation: ₹{(player.soldPrice || player.basePrice * 1.5).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SPONSORS TAB */}
          {activeTab === 'sponsors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-white">Tournament Sponsors ({sponsors.length})</h3>
                  <p className="text-xs font-normal text-white/50">
                    Official partners, Title, Powered By, and Kit sponsorship logos.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddSponsorOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-all shadow-md"
                >
                  <IoAddOutline size={16} />
                  <span>Add Sponsor</span>
                </button>
              </div>

              {sponsors.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <p className="text-sm font-normal text-white/40">No sponsors added to this tournament yet.</p>
                  <button
                    onClick={() => setIsAddSponsorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-xl transition-colors"
                  >
                    <IoAddOutline size={16} /> Add Sponsor
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {sponsors.map((sponsor) => (
                    <div
                      key={sponsor._id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-[#0466c8]/20 text-[#87c2fd] border border-[#0466c8]/30">
                          {sponsor.tier}
                        </span>
                        <button
                          onClick={async () => {
                            if (confirm(`Remove sponsor ${sponsor.name}?`)) {
                              const token = getStoredToken() || '';
                              await deleteSponsor(auction._id, sponsor._id, token);
                              setSponsors((prev) => prev.filter((s) => s._id !== sponsor._id));
                            }
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <IoTrashOutline size={14} />
                        </button>
                      </div>

                      <div className="relative w-full h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                        <Image
                          src={sponsor.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                          alt={sponsor.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="text-center">
                        <h4 className="text-xs font-medium text-white">{sponsor.name}</h4>
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-normal text-white/40 hover:text-[#87c2fd] transition-colors"
                          >
                            Visit Site
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. LINK TAB */}
          {activeTab === 'link' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-white">Sharable Tournament Links</h3>
                <p className="text-xs font-normal text-white/50">
                  Direct portals for public audience, franchise team registration, and player entries.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'public',
                    title: 'Live Auction Arena Link',
                    desc: 'Share with fans, spectators, and team managers',
                    url: publicAuctionUrl,
                  },
                  {
                    key: 'team',
                    title: 'Team Franchise Registration Link',
                    desc: 'Share with franchise owners to register their teams',
                    url: teamRegistrationUrl,
                  },
                  {
                    key: 'player',
                    title: 'Player Catalog Entry Link',
                    desc: 'Public or invited players submit dynamic form data',
                    url: playerRegistrationUrl,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-white">{item.title}</h4>
                      <p className="text-xs font-normal text-white/50">{item.desc}</p>
                      <code className="text-xs font-normal text-[#87c2fd] bg-black/30 px-2 py-0.5 rounded mt-1.5 inline-block">
                        {item.url}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(item.url, item.key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
                      >
                        {copiedLink === item.key ? (
                          <>
                            <IoCheckmarkCircleOutline className="text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <IoCopyOutline />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Join ${auction.name}: ${item.url}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/70 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <IoLogoWhatsapp size={15} />
                      </a>

                      <a
                        href={`mailto:?subject=${encodeURIComponent(
                          `Invitation: ${auction.name}`
                        )}&body=${encodeURIComponent(
                          `You are invited to ${auction.name}.\n\nAccess Link: ${item.url}`
                        )}`}
                        className="p-2 text-white/70 hover:text-[#87c2fd] bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        title="Share via Email"
                      >
                        <IoMailOutline size={15} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-white">Auction Rules & Operational Bounds</h3>
                <p className="text-xs font-normal text-white/50">
                  Pre-configured tournament limits enforced on the backend bidding engine.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h4 className="text-xs font-medium text-white/70">Purse & Budget Allocation</h4>
                  <p className="text-sm font-medium text-white">
                    ₹{auction.pointsBalancePerTeam.toLocaleString()} Points Per Team
                  </p>
                  <p className="text-xs font-normal text-white/40">
                    Strict purse boundary. No team may bid beyond their remaining balance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h4 className="text-xs font-medium text-white/70">Player Roster Slots</h4>
                  <p className="text-sm font-medium text-white">{auction.playersPerTeam} Maximum Players</p>
                  <p className="text-xs font-normal text-white/40">
                    Teams cannot bid on additional players once roster capacity is reached.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h4 className="text-xs font-medium text-white/70">Bidding Increments</h4>
                  <p className="text-sm font-medium text-white">₹{auction.bidIncrement.toLocaleString()} Step</p>
                  <p className="text-xs font-normal text-white/40">
                    Each counter bid advances the floor gavel by exactly this minimum increment.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h4 className="text-xs font-medium text-white/70">Bid Floor & Ceiling</h4>
                  <p className="text-sm font-medium text-white">
                    Min: ₹{auction.minimumBid.toLocaleString()} • Max: ₹{auction.maximumBid.toLocaleString()}
                  </p>
                  <p className="text-xs font-normal text-white/40">
                    Validated bounds enforced by the database transaction manager.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper Modals */}
      <ShareAuctionDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        auction={auction}
      />

      <AddTeamModal
        isOpen={isAddTeamOpen}
        onClose={() => setIsAddTeamOpen(false)}
        auctionId={auction._id}
        auctionName={auction.name}
        defaultPurse={auction.pointsBalancePerTeam}
        defaultMaxPlayers={auction.playersPerTeam}
        onTeamAdded={(newTeam) => setTeams((prev) => [...prev, newTeam])}
      />

      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        auctionId={auction._id}
        auctionName={auction.name}
        sport={auction.sport}
        defaultBasePrice={auction.minimumBid}
        teams={teams}
        onPlayerAdded={(newPlayer) => setPlayers((prev) => [...prev, newPlayer])}
      />

      <PlayerDisplaySettingsModal
        isOpen={isDisplaySettingsOpen}
        onClose={() => setIsDisplaySettingsOpen(false)}
        auctionId={auction._id}
        onSaved={refreshAuction}
        initialPreviewTarget={displayPreviewTarget}
        auctionTitle={auction.name}
        roomCode={(auction as any).code || (auction as any).roomCode || auction.slug || 'A21F00'}
      />

      <AddSponsorModal
        isOpen={isAddSponsorOpen}
        onClose={() => setIsAddSponsorOpen(false)}
        auctionId={auction._id}
        onSponsorAdded={(newSponsor) => setSponsors((prev) => [...prev, newSponsor])}
      />

      <LiveTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        auctionName={auction.name}
        sport={auction.sport}
      />

      <TeamFormOverrideModal
        isOpen={!!selectedTeamForOverride}
        onClose={() => setSelectedTeamForOverride(null)}
        auctionId={auction._id}
        team={selectedTeamForOverride}
        onSaved={() => {
          // Re-fetch teams or notify
        }}
      />

      <StartAuctionModeDialog
        isOpen={isStartModeOpen}
        onClose={() => setIsStartModeOpen(false)}
        onConfirm={handleConfirmStartAuction}
        loading={isStartingSession}
        auctionName={auction.name}
      />
    </div>
  );
}

function AuctionProfileWrapper({ params }: PageProps) {
  const resolvedParams = use(params);
  return <AuctionProfileContent id={resolvedParams.id} />;
}

export default function AuctionProfilePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#011428] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0466c8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuctionProfileWrapper params={params} />
    </Suspense>
  );
}
