"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  Users,
  UserCheck,
  Shield,
  Lock,
  Globe,
  Share2,
  Gavel,
  CheckCircle2,
  AlertCircle,
  Radio,
  Timer,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Plane,
  Key,
  Star,
  ExternalLink,
  Mail,
  MessageSquare,
  Settings,
  Plus,
} from "lucide-react";
import {
  getAuctionById,
  getTeams,
  getPlayers,
  getSponsors,
  requestAuctionAccess,
  startAuctionSession,
  type Auction,
  type Team,
  type Player,
  type Sponsor,
  type UserProfile,
} from "@/lib/api";
import { ShareAuctionDialog } from "@/components/admin/ShareAuctionDialog";
import { LiveTrackingModal } from "@/components/auction-profile/LiveTrackingModal";
import { AddTeamModal } from "@/components/auction-profile/AddTeamModal";
import { AddPlayerModal } from "@/components/auction-profile/AddPlayerModal";
import { PlayerDisplaySettingsModal } from "@/components/auction-profile/PlayerDisplaySettingsModal";
import { StartAuctionModeDialog } from "@/components/auction/StartAuctionModeDialog";
import { TeamCard } from "@/components/teams/TeamCard";
import { DeleteTeamDialog } from "@/components/teams/DeleteTeamDialog";
import { teamService } from "@/services/team.service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type TabKey = "teams" | "players" | "mvp" | "sponsors" | "link" | "about";

function AuctionDetailContent() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [canAccess, setCanAccess] = useState<boolean>(true);
  const [accessStatus, setAccessStatus] = useState<string>("NONE");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>("teams");
  const [shareOpen, setShareOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
  const [isStartModeOpen, setIsStartModeOpen] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);


  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      setDeleteTeamLoading(true);
      const activeToken = token || localStorage.getItem("aotms_access_token") || localStorage.getItem("lotvault_access_token") || "";
      await teamService.deleteTeam(auctionId, teamToDelete._id, activeToken);
      setTeamToDelete(null);
      await loadAuctionData();
    } catch (err: any) {
      alert(err.message || "Failed to delete team.");
    } finally {
      setDeleteTeamLoading(false);
    }
  };

  const handleConfirmStartAuction = async (mode: 'NORMAL' | 'LIVE') => {
    try {
      setIsStartingSession(true);
      await startAuctionSession(auctionId, mode, 'RANDOM', token || undefined);
      router.push(`/admin/auctions/${auctionId}/live?mode=${mode}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start auction session');
    } finally {
      setIsStartingSession(false);
      setIsStartModeOpen(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("aotms_access_token") || localStorage.getItem("lotvault_access_token");
    const savedUser = localStorage.getItem("aotms_user") || localStorage.getItem("lotvault_user");
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!auctionId) return;
    loadAuctionData();
  }, [auctionId, token]);

  const loadAuctionData = async () => {
    setLoading(true);
    try {
      const [res, teamsRes, playersRes, sponsorsRes] = await Promise.all([
        getAuctionById(auctionId, token || undefined),
        getTeams(auctionId),
        getPlayers(auctionId),
        getSponsors(auctionId),
      ]);

      if (res.data) setAuction(res.data);
      setCanAccess(res.canAccess ?? true);
      setAccessStatus(res.accessStatus || "NONE");
      if (res.message) setMessage(res.message);

      setTeams(teamsRes || []);
      setPlayers(playersRes || []);
      setSponsors(sponsorsRes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    setRequestLoading(true);
    try {
      const res = await requestAuctionAccess(auctionId, token);
      setFeedback(res.message);
      setAccessStatus("PENDING");
    } catch (err: any) {
      setFeedback(err.message || "Failed to submit access request.");
    } finally {
      setRequestLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export Results Excel (CSV)
  const handleExportCSV = () => {
    if (!auction) return;
    const rows = [
      ["Auction Name", auction.name],
      ["Sport", auction.sport],
      ["Scheduled At", auction.scheduledAt],
      ["Total Teams", teams.length.toString()],
      ["Total Players", players.length.toString()],
      [],
      ["TEAM ROSTER REPORT"],
      ["Team Name", "Team Code", "Owner", "Purse Total", "Purse Remaining", "Players Count"],
      ...teams.map((t) => [
        t.name,
        t.code,
        t.ownerName || "N/A",
        t.purseTotal.toString(),
        t.purseRemaining.toString(),
        t.playersCount.toString(),
      ]),
      [],
      ["PLAYER CATALOG REPORT"],
      ["Player Name", "Role", "Email", "Base Price", "Status", "Assigned Team"],
      ...players.map((p) => [
        p.name,
        p.role,
        p.email,
        p.basePrice.toString(),
        p.status,
        typeof p.teamId === "object" && p.teamId ? (p.teamId as any).name : "Pool",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${auction.name.replace(/\s+/g, "_")}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white">
        <div className="size-9 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#02131b] flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#031822] border border-[#0d3f4f] text-center space-y-4">
          <p className="text-sm text-red-400">Auction not found</p>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  const auctionCode = auction._id ? auction._id.slice(-6).toLowerCase() : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicAuctionUrl = `${origin}/auctions/${auction._id}`;
  const teamRegistrationUrl = `${origin}/auctions/${auction._id}?register=team`;
  const playerRegistrationUrl = `${origin}/auctions/${auction._id}?register=player`;

  const dateObj = new Date(auction.scheduledAt);
  const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}-${String(
    dateObj.getMonth() + 1
  ).padStart(2, "0")}-${dateObj.getFullYear()}`;
  const formattedTime = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  const isLive = auction.status === "LIVE";
  const isDraft = auction.status === "DRAFT";
  const statusBadgeText = isLive ? "LIVE TOURNAMENT" : isDraft ? "DRAFT TOURNAMENT" : `${auction.status} TOURNAMENT`;
  const startedStatusText = isLive ? "Started" : isDraft ? "Draft" : "Scheduled";

  const isOrganizerOrAdmin = currentUser?.role === "ADMIN" || auction.ownerId?._id === currentUser?.id;

  return (
    <div className="min-h-screen bg-[#02131b] text-white flex flex-col font-sans font-normal selection:bg-[#00d2ee]/30 selection:text-white relative">
      {/* ===================== TOP NAVBAR (NORMAL UPDATE) ===================== */}
      <header className="w-full border-b border-[#0d3f4f]/80 bg-[#02131b]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/auctions"
            className="p-1.5 rounded-lg text-[#7fa3b0] hover:text-[#00d2ee] hover:bg-[#031d27] transition-colors"
            title="Back to Auctions"
          >
            <ArrowLeft className="size-5" />
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
          <span className="text-xs font-mono uppercase tracking-wider text-[#7fa3b0] hidden sm:inline truncate max-w-xs">
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
            onClick={() => setShareOpen(true)}
            className="p-2 rounded-xl bg-[#031d27] hover:bg-[#052735] border border-[#0d3f4f] hover:border-[#00d2ee] text-[#7fa3b0] hover:text-[#00d2ee] transition-all cursor-pointer shadow-sm"
            title="Share Auction"
          >
            <Share2 className="size-4" />
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

      {/* ================= CASE 1: ACCESS RESTRICTED (PRIVATE AUCTION) ================= */}
      {!canAccess ? (
        <main className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-[#031822] border border-[#0d3f4f] shadow-2xl text-center space-y-6">
          <div className="size-16 rounded-2xl bg-[#02131b] border border-[#f97316]/60 mx-auto flex items-center justify-center text-[#f97316]">
            <Lock className="size-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#f97316]/20 text-[#fb923c] border border-[#f97316]/40 inline-block">
              Invitation-Only Arena
            </span>
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase">{auction.name}</h2>
            <p className="text-xs sm:text-sm text-[#7fa3b0] leading-relaxed">
              {message ||
                "This is an invitation-only tournament auction. You must request access and receive authorization to enter."}
            </p>
          </div>

          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="pt-2">
            {accessStatus === "PENDING" ? (
              <div className="p-4 rounded-2xl bg-[#02131b] border border-amber-500/50 text-amber-300 text-xs space-y-1">
                <p className="font-medium text-sm">Access Request Pending Review</p>
                <p className="text-[#7fa3b0]">Your request was submitted. The organizer has been notified.</p>
              </div>
            ) : token ? (
              <button
                type="button"
                disabled={requestLoading}
                onClick={handleRequestAccess}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#00d2ee] to-[#0466c8] text-[#02131b] font-semibold text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {requestLoading ? "Submitting Request..." : "Request Private Access"}
              </button>
            ) : (
              <Link
                href="/auth?mode=login"
                className="block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#00d2ee] to-[#0466c8] text-[#02131b] font-semibold text-sm shadow-lg transition-all text-center"
              >
                Sign In to Request Access
              </Link>
            )}
          </div>
        </main>
      ) : (
        /* ================= CASE 2: MAIN AUCTION DETAILS VIEW ================= */
        <>
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
              {/* Cyan/Night gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#02131b]/60 via-[#02141d]/85 to-[#021118]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
                {/* Left: Square Tournament Poster */}
                <div className="relative size-28 sm:size-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#00d2ee] shadow-[0_0_25px_rgba(0,210,238,0.4)] shrink-0 bg-[#021822]">
                  <Image
                    src={auction.image?.url || "/stadium-band.jpg"}
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
                          isLive ? "bg-rose-500 animate-ping" : isDraft ? "bg-amber-400" : "bg-emerald-400"
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
                      onClick={() => copyToClipboard(auctionCode, "code")}
                      className="p-1 text-[#7fa3b0] hover:text-[#00d2ee] transition-colors cursor-pointer"
                      title="Copy auction code"
                    >
                      {copiedKey === "code" ? (
                        <Check className="size-4 text-emerald-400" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>

                  {/* 4. Schedule Date & Time Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#7fa3b0]">
                    <Calendar className="size-4 text-[#00d2ee]" />
                    <span>
                      {formattedDate}, {formattedTime}
                    </span>
                  </div>

                  {/* 5. Meta Statistics Row */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#7fa3b0]">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4 text-[#00d2ee]" />
                      <span>{auction.playersPerTeam || 13} Player Per Team</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="size-4 text-[#00d2ee]" />
                      <span>{players.length} Registered</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Timer className="size-4 text-[#00d2ee]" />
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
                      <FileSpreadsheet className="size-3.5" />
                      <span>Auction Result Excel</span>
                    </button>

                    {/* 2. Auction Result PDF */}
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#00d2ee]/70 bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 text-[#00d2ee] text-xs font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <FileText className="size-3.5" />
                      <span>Auction Result PDF</span>
                    </button>

                    {/* 3. Role:Admin -> Customized Form */}
                    {isOrganizerOrAdmin && (
                      <Link
                        href={`/admin/auctions/${auction._id}/form-builder`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-violet-500/70 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
                      >
                        <Settings className="size-3.5" />
                        <span>Customized Form</span>
                      </Link>
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollArea className="w-full">
                <nav className="flex items-center gap-6 sm:gap-10 py-1">
                  {(
                    [
                      { key: "teams", label: `TEAMS (${teams.length})` },
                      { key: "players", label: `PLAYERS (${players.length})` },
                      { key: "mvp", label: "MVP LEADERBOARD" },
                      { key: "sponsors", label: `SPONSORS (${sponsors.length})` },
                      { key: "link", label: "REGISTRATION LINKS" },
                      { key: "about", label: "RULES & ABOUT" },
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
                            ? "text-[#00d2ee] border-[#00d2ee]"
                            : "text-white/60 hover:text-white border-transparent"
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

          {/* ===================== TAB CONTENT AREA ===================== */}
          <main className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* 1. TEAMS TAB */}
            {activeTab === "teams" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-mono font-medium text-white uppercase">
                      Franchise Teams ({teams.length})
                    </h3>
                    <p className="text-xs text-[#7fa3b0]">
                      Participating tournament franchises, allocated purse, and roster capacities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamToEdit(null);
                      setIsAddTeamOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="size-4" />
                    <span>+ New Team</span>
                  </button>
                </div>

                {teams.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#031822] border border-[#0d3f4f] space-y-3">
                    <p className="text-sm text-[#7fa3b0]">No franchise teams added yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamToEdit(null);
                        setIsAddTeamOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] rounded-xl transition-all shadow-sm cursor-pointer mx-auto"
                    >
                      <Plus className="size-4" />
                      <span>+ New Team</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <TeamCard
                        key={team._id}
                        team={team}
                        isAdmin={isOrganizerOrAdmin}
                        onEdit={(t) => {
                          setTeamToEdit(t);
                          setIsAddTeamOpen(true);
                        }}
                        onDelete={(t) => {
                          setTeamToDelete(t);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. PLAYERS TAB */}
            {activeTab === "players" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-mono font-medium text-white uppercase">
                      Registered Players ({players.length})
                    </h3>
                    <p className="text-xs text-[#7fa3b0]">
                      Complete tournament player catalog, roles, base valuations, and franchise statuses.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isOrganizerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsDisplaySettingsOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium text-[#7fa3b0] hover:text-[#00d2ee] bg-[#031d27] hover:bg-[#031d27]/80 border border-[#0d3f4f] hover:border-[#00d2ee]/50 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Configure Visible Fields on Player Display Card"
                      >
                        <Settings className="size-3.5" />
                        <span>Display Settings</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAddPlayerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span> New Player</span>
                    </button>
                  </div>
                </div>

                {players.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#031822] border border-[#0d3f4f] space-y-3">
                    <p className="text-sm text-[#7fa3b0]">No players registered in this auction yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddPlayerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] rounded-xl transition-all shadow-sm cursor-pointer mx-auto"
                    >
                      <Plus className="size-4" />
                      <span> New Player</span>
                    </button>
                  </div>
                ) : (
                  <ScrollArea className="w-full rounded-2xl border border-[#0d3f4f] bg-[#031822]/90">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#0d3f4f] text-[#7fa3b0] bg-[#02131b]">
                          <th className="py-3 px-4 font-mono">Player</th>
                          <th className="py-3 px-4 font-mono">Role</th>
                          <th className="py-3 px-4 font-mono">Base Price</th>
                          <th className="py-3 px-4 font-mono">Status</th>
                          <th className="py-3 px-4 font-mono">Franchise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0d3f4f]/50">
                        {players.map((player) => (
                          <tr key={player._id} className="hover:bg-[#04202e] transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative size-8 rounded-lg overflow-hidden bg-[#02131b] border border-[#0d3f4f] shrink-0">
                                  <Image
                                    src={
                                      player.profileImage ||
                                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
                                    }
                                    alt={player.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="font-medium text-white block">{player.name}</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] text-[#7fa3b0]">{player.email}</span>
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
                                            <span key={k} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#00d2ee]/10 text-[#00d2ee] border border-[#00d2ee]/30">
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
                            <td className="py-3 px-4 text-white/80">{player.role}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-[#00d2ee]">
                              ₹{player.basePrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                  player.status === "SOLD"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : player.status === "APPROVED"
                                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                                    : "bg-white/5 text-white/60 border border-white/10"
                                }`}
                              >
                                {player.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#7fa3b0]">
                              {typeof player.teamId === "object" && player.teamId
                                ? (player.teamId as any).name
                                : "In Pool"}
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

            {/* 3. MVP TAB */}
            {activeTab === "mvp" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase">MVP Leaderboard</h3>
                  <p className="text-xs text-[#7fa3b0]">
                    Highest valued players and key performers ranked by bidding auction demand.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {players.slice(0, 3).map((player, idx) => (
                    <div
                      key={player._id}
                      className="p-5 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Star className="size-3" /> Rank #{idx + 1}
                        </span>
                        <span className="text-xs text-[#7fa3b0]">{player.role}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative size-12 rounded-xl overflow-hidden bg-[#02131b] border border-[#0d3f4f] shrink-0">
                          <Image
                            src={
                              player.profileImage ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
                            }
                            alt={player.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{player.name}</h4>
                          <span className="text-xs font-mono text-[#00d2ee]">
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
            {activeTab === "sponsors" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase">
                    Tournament Sponsors ({sponsors.length})
                  </h3>
                  <p className="text-xs text-[#7fa3b0]">Official partners, brands, and title supporters.</p>
                </div>

                {sponsors.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#031822] border border-[#0d3f4f] space-y-2">
                    <p className="text-sm text-[#7fa3b0]">No sponsors added to this tournament yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {sponsors.map((sponsor) => (
                      <div
                        key={sponsor._id}
                        className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-3 text-center"
                      >
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30 inline-block">
                          {sponsor.tier}
                        </span>

                        <div className="relative w-full h-16 rounded-xl overflow-hidden bg-[#02131b] border border-[#0d3f4f] flex items-center justify-center">
                          <Image
                            src={
                              sponsor.logo ||
                              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200"
                            }
                            alt={sponsor.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-white">{sponsor.name}</h4>
                          {sponsor.website && (
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#7fa3b0] hover:text-[#00d2ee] transition-colors inline-flex items-center gap-1 mt-1"
                            >
                              <span>Visit Website</span>
                              <ExternalLink className="size-3" />
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
            {activeTab === "link" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase">Sharable Tournament Links</h3>
                  <p className="text-xs text-[#7fa3b0]">
                    Direct invite portals for audience spectators, franchise registrations, and player submissions.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "public",
                      title: "Live Auction Arena Link",
                      desc: "Share with spectators, fans, and audience members",
                      url: publicAuctionUrl,
                    },
                    {
                      key: "team",
                      title: "Team Franchise Registration Link",
                      desc: "Direct link for team owners and franchise management",
                      url: teamRegistrationUrl,
                    },
                    {
                      key: "player",
                      title: "Player Catalog Entry Link",
                      desc: "Form link for new players to enter auction catalog",
                      url: playerRegistrationUrl,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                        <p className="text-xs text-[#7fa3b0]">{item.desc}</p>
                        <code className="text-xs font-mono text-[#00d2ee] bg-[#02131b] border border-[#0d3f4f] px-2 py-0.5 rounded mt-1.5 inline-block">
                          {item.url}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url, item.key)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors cursor-pointer"
                        >
                          {copiedKey === item.key ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
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
                          <MessageSquare className="size-3.5" />
                        </a>

                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            `Invitation: ${auction.name}`
                          )}&body=${encodeURIComponent(
                            `You are invited to ${auction.name}.\n\nAccess Link: ${item.url}`
                          )}`}
                          className="p-2 text-white/70 hover:text-[#00d2ee] bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                          title="Share via Email"
                        >
                          <Mail className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ABOUT TAB */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase">Rules & About</h3>
                  <p className="text-xs text-[#7fa3b0]">
                    Tournament specifications, purse constraints, and bidding mechanics.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-2">
                    <h4 className="text-xs font-mono font-semibold text-[#00d2ee] uppercase">
                      Purse & Budget Allocation
                    </h4>
                    <p className="text-base font-mono font-bold text-white">
                      ₹{auction.pointsBalancePerTeam.toLocaleString()} Points Per Team
                    </p>
                    <p className="text-xs text-[#7fa3b0]">
                      Strict team purse cap enforced during live floor counter-bidding.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-2">
                    <h4 className="text-xs font-mono font-semibold text-[#00d2ee] uppercase">Player Roster Slots</h4>
                    <p className="text-base font-mono font-bold text-white">{auction.playersPerTeam} Maximum Players</p>
                    <p className="text-xs text-[#7fa3b0]">
                      Teams cannot exceed maximum roster limit once full squad is acquired.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-2">
                    <h4 className="text-xs font-mono font-semibold text-[#00d2ee] uppercase">Bidding Increments</h4>
                    <p className="text-base font-mono font-bold text-white">₹{auction.bidIncrement.toLocaleString()} Step</p>
                    <p className="text-xs text-[#7fa3b0]">
                      Each counter-bid advances the gavel by exactly this minimum increment.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#031822]/90 border border-[#0d3f4f] space-y-2">
                    <h4 className="text-xs font-mono font-semibold text-[#00d2ee] uppercase">Bid Floor & Ceiling</h4>
                    <p className="text-base font-mono font-bold text-white">
                      Min: ₹{auction.minimumBid.toLocaleString()} • Max: ₹{auction.maximumBid.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#7fa3b0]">
                      Validated boundaries enforced by the automated bidding engine.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* Share Dialog */}
      <ShareAuctionDialog isOpen={shareOpen} onClose={() => setShareOpen(false)} auction={auction} />

      {/* Live Tracking Modal */}
      <LiveTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        auctionName={auction.name}
        sport={auction.sport}
      />

      {/* Create / Edit Team Customized Form Modal */}
      {auction && (
        <AddTeamModal
          isOpen={isAddTeamOpen}
          onClose={() => {
            setIsAddTeamOpen(false);
            setTeamToEdit(null);
          }}
          auctionId={auction._id}
          auctionName={auction.name}
          defaultPurse={auction.pointsBalancePerTeam || 10000000}
          defaultMaxPlayers={auction.playersPerTeam || 15}
          teamToEdit={teamToEdit}
          onTeamAdded={async () => {
            setTeamToEdit(null);
            setIsAddTeamOpen(false);
            await loadAuctionData();
          }}
        />
      )}

      {/* Delete Team Confirmation Dialog */}
      <DeleteTeamDialog
        isOpen={Boolean(teamToDelete)}
        team={teamToDelete}
        loading={deleteTeamLoading}
        onClose={() => setTeamToDelete(null)}
        onConfirm={handleConfirmDeleteTeam}
      />

      {/* Add Player Modal */}
      {auction && (
        <AddPlayerModal
          isOpen={isAddPlayerOpen}
          onClose={() => setIsAddPlayerOpen(false)}
          auctionId={auction._id}
          auctionName={auction.name}
          sport={auction.sport || "CRICKET"}
          defaultBasePrice={auction.minimumBid || 1000}
          teams={teams as any}
          onPlayerAdded={(newPlayer) => {
            setPlayers((prev) => {
              const exists = prev.some((p) => p._id === newPlayer._id);
              return exists ? prev : [...prev, newPlayer as any];
            });
            loadAuctionData();
          }}
        />
      )}

      {/* Player Display Settings Modal */}
      {auction && (
        <PlayerDisplaySettingsModal
          isOpen={isDisplaySettingsOpen}
          onClose={() => setIsDisplaySettingsOpen(false)}
          auctionId={auction._id}
          onSaved={() => loadAuctionData()}
        />
      )}

      {auction && (
        <StartAuctionModeDialog
          isOpen={isStartModeOpen}
          onClose={() => setIsStartModeOpen(false)}
          onConfirm={handleConfirmStartAuction}
          loading={isStartingSession}
          auctionName={auction.name}
        />
      )}
    </div>
  );
}

export default function AuctionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white">
          <div className="size-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuctionDetailContent />
    </Suspense>
  );
}
