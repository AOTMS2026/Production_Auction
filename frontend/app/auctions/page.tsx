"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Lock,
  Globe,
  Share2,
  Calendar,
  Clock,
  Coins,
  Users,
  Shield,
  ArrowRight,
  Gavel,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import {
  getAuctions,
  deleteAuction,
  requestAuctionAccess,
  getStoredToken,
  getStoredUser,
  type Auction,
  type SportType,
  type UserProfile,
} from "@/lib/api";
import { ShareAuctionDialog } from "@/components/admin/ShareAuctionDialog";
import { CreateAuctionModal } from "@/components/admin/CreateAuctionModal";

const SPORTS_OPTIONS = [
  { label: "All sports", value: "ALL" },
  { label: "Cricket", value: "CRICKET" },
  { label: "Volleyball", value: "VOLLEYBALL" },
  { label: "Football", value: "FOOTBALL" },
  { label: "Kabaddi", value: "KABADDI" },
  { label: "Badminton", value: "BADMINTON" },
];

const VISIBILITY_OPTIONS = [
  { label: "All visibility", value: "ALL" },
  { label: "Public", value: "PUBLIC" },
  { label: "Private", value: "PRIVATE" },
];

export default function AuctionsDiscoveryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sportFilter, setSportFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals & Actions
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [auctionToEdit, setAuctionToEdit] = useState<Auction | null>(null);
  const [shareAuction, setShareAuction] = useState<Auction | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hovered / active auction index
  const [activeAuctionId, setActiveAuctionId] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    if (savedToken) setToken(savedToken);
    if (savedUser) setCurrentUser(savedUser);
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [sportFilter, visibilityFilter, search, token]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const activeToken = token || getStoredToken();
      const res = await getAuctions(
        {
          sport: sportFilter,
          visibility: visibilityFilter,
          search,
        },
        activeToken || undefined
      );
      setAuctions(res.items || []);
      if (res.items?.length > 0 && !activeAuctionId) {
        setActiveAuctionId(res.items[0]._id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (!token && !getStoredToken()) {
      router.push("/auth?mode=login");
      return;
    }
    setAuctionToEdit(null);
    setCreateModalOpen(true);
  };

  const handleDeleteAuction = async (auctionId: string, auctionName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const activeToken = token || getStoredToken();
    if (!activeToken) {
      showNotice("error", "Sign in as administrator to manage this auction.");
      return;
    }

    if (!confirm(`Are you sure you want to remove "${auctionName}"?`)) return;

    try {
      await deleteAuction(auctionId, activeToken);
      showNotice("success", `Auction "${auctionName}" successfully deleted.`);
      loadAuctions();
    } catch (err: any) {
      showNotice("error", err.message || "Failed to delete auction.");
    }
  };

  const handleRequestAccess = async (auctionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const activeToken = token || getStoredToken();
    if (!activeToken) {
      showNotice("error", "Please log in to submit a private auction access request.");
      return;
    }

    try {
      const res = await requestAuctionAccess(auctionId, activeToken);
      showNotice("success", res.message || "Access request submitted.");
      loadAuctions();
    } catch (err: any) {
      showNotice("error", err.message || "Failed to request access.");
    }
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#020f14] text-white flex flex-col font-sans selection:bg-[#00d2ee] selection:text-black relative overflow-x-hidden">
      {/* Background Radial Atmosphere matching the image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(0,210,238,0.14),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,180,216,0.06),transparent_50%)]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-[#093543]/60 bg-[#04151d]/85 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/AOTMS__logo.png"
              alt="AOTMS Logo"
              width={120}
              height={38}
              className="object-contain h-8 w-auto filter drop-shadow-[0_0_8px_rgba(0,210,238,0.3)]"
              priority
            />
          </Link>
          <div className="h-5 w-px bg-[#093543] hidden sm:block" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#7fa3b0] hidden sm:inline">
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
            className="text-xs text-[#00d2ee] px-3 py-1.5 rounded-lg bg-[#051c24] border border-[#00d2ee]/30 transition-colors font-mono"
          >
            Auctions
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#051c24] border border-[#0d3b4b] rounded-full px-3 py-1 text-xs">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="size-5 rounded-full object-cover border border-[#00d2ee]"
              />
              <span className="text-[#e2f1f6] hidden sm:inline">{currentUser.name}</span>
            </div>
          ) : (
            <Link
              href="/auth?mode=login"
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff5500] to-[#ff7b00] hover:from-[#ff6611] hover:to-[#ff8c1a] text-white text-xs font-medium shadow-[0_0_15px_rgba(255,90,0,0.4)] transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Floating Action Notice */}
      {actionMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border text-xs font-normal flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 ${
            actionMessage.type === "success"
              ? "bg-[#041d27]/95 border-[#00d2ee] text-[#00d2ee] shadow-[0_0_20px_rgba(0,210,238,0.3)]"
              : "bg-rose-950/95 border-rose-500/70 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="size-4 text-[#00d2ee]" />
          ) : (
            <AlertCircle className="size-4 text-rose-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Container matching the screenshot layout */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7 flex-1">
        {/* Header Hero Area */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="space-y-2.5">
            {/* Pill Badge: ORGANIZER CONSOLE */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00d2ee]/70 bg-[#00d2ee]/10 text-[#00d2ee] text-[10px] font-mono tracking-widest uppercase shadow-[0_0_12px_rgba(0,210,238,0.35)]">
              <LayoutGrid className="size-3 text-[#00d2ee]" />
              <span>Organizer Console</span>
            </div>

            {/* Main Headline: MY AUCTIONS */}
            <h1 className="text-3xl sm:text-4xl font-mono font-medium tracking-wider text-white">
              MY AUCTIONS
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#7aa2b0] font-normal max-w-xl">
              Manage tournaments, squad rosters, and live bidding sessions.
            </p>
          </div>

          {/* Right Action: + Create Auction Button */}
          <div>
            <button
              type="button"
              onClick={handleCreateClick}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ff5500] to-[#ff7b00] hover:from-[#ff6611] hover:to-[#ff8c1a] text-white text-xs sm:text-sm font-medium shadow-[0_0_25px_rgba(255,90,0,0.45)] hover:shadow-[0_0_35px_rgba(255,100,0,0.6)] transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Create Auction</span>
            </button>
          </div>
        </div>

        {/* Filter Bar (All sports, All visibility, Search) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Sports Dropdown Pill */}
          <div className="relative">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="appearance-none bg-[#051c24] border border-[#0b3846] hover:border-[#00d2ee]/60 text-[#88abb8] hover:text-white rounded-full pl-5 pr-9 py-2 text-xs font-normal outline-none cursor-pointer transition-all shadow-sm"
            >
              {SPORTS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#04151d] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-3 text-[#7fa3b0] pointer-events-none" />
          </div>

          {/* Visibility Dropdown Pill */}
          <div className="relative">
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="appearance-none bg-[#051c24] border border-[#0b3846] hover:border-[#00d2ee]/60 text-[#88abb8] hover:text-white rounded-full pl-5 pr-9 py-2 text-xs font-normal outline-none cursor-pointer transition-all shadow-sm"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#04151d] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-3 text-[#7fa3b0] pointer-events-none" />
          </div>

          {/* Search Input Pill */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-[#507280]" />
            <input
              type="text"
              placeholder="Search tournament auctions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#051c24] border border-[#0b3846] focus:border-[#00d2ee] focus:shadow-[0_0_15px_rgba(0,210,238,0.25)] text-white placeholder-[#507280] rounded-full pl-10 pr-4 py-2 text-xs outline-none transition-all"
            />
          </div>
        </div>

        {/* Auctions List (Exact Image Style Stack) */}
        {loading ? (
          <div className="p-16 text-center text-xs font-mono text-[#7aa2b0]">
            <div className="size-7 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Loading tournament auctions...</span>
          </div>
        ) : auctions.length === 0 ? (
          <div className="p-14 rounded-3xl bg-[#051c24]/80 border border-[#0b3846] text-center space-y-3 shadow-xl">
            <Gavel className="size-8 text-[#00d2ee] mx-auto opacity-50" />
            <h3 className="text-sm font-normal text-white">No auctions found</h3>
            <p className="text-xs text-[#7aa2b0]">
              Create your first sports auction or modify your search filters above.
            </p>
            <button
              type="button"
              onClick={handleCreateClick}
              className="px-5 py-2 rounded-full bg-[#00d2ee]/20 hover:bg-[#00d2ee]/30 border border-[#00d2ee] text-[#00d2ee] text-xs font-medium inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,238,0.25)] cursor-pointer transition-all"
            >
              <Plus className="size-3.5" />
              <span>Create Auction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((auc, index) => {
              const isSelected = activeAuctionId === auc._id || (index === 0 && !activeAuctionId);

              // Unified target navigation url
              const targetUrl = `/auctions/${auc._id}`;

              return (
                <div
                  key={auc._id}
                  onClick={() => setActiveAuctionId(auc._id)}
                  className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-all duration-300 relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                    isSelected
                      ? "bg-[#041d27]/95 border-2 border-[#00d2ee] shadow-[0_0_25px_rgba(0,210,238,0.38)]"
                      : "bg-[#051c25]/85 border border-[#093847] hover:border-[#00d2ee] hover:shadow-[0_0_20px_rgba(0,210,238,0.25)] hover:bg-[#06212c]"
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <Link
                      href={targetUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="size-13 sm:size-14 rounded-xl sm:rounded-2xl overflow-hidden bg-[#020f14] border border-[#0d3f4f] shrink-0 group-hover:border-[#00d2ee] transition-colors relative block"
                    >
                      <img
                        src={auc.image?.url || "https://images.unsplash.com/photo-1531415074868-83633dd5e45c?w=800&auto=format&fit=crop&q=80"}
                        alt={auc.name}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Auction Info */}
                    <div className="min-w-0 space-y-1.5">
                      <Link
                        href={targetUrl}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-sm sm:text-base font-medium truncate block transition-colors ${
                          isSelected ? "text-[#38bdf8]" : "text-white group-hover:text-[#00d2ee]"
                        }`}
                        title={auc.name}
                      >
                        {auc.name}
                      </Link>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-[#7fa3b0]">
                        {/* Sport Badge Pill */}
                        <span className="border border-[#00d2ee]/60 bg-[#00d2ee]/15 text-[#00d2ee] text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full">
                          {auc.sport}
                        </span>

                        {/* Calendar / Date */}
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs text-[#7fa3b0]">
                          <Calendar className="size-3 text-[#00d2ee]" />
                          <span>
                            {new Date(auc.scheduledAt).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            ,{" "}
                            {new Date(auc.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>

                        {/* Dot */}
                        <span className="text-[#32525f] hidden sm:inline">•</span>

                        {/* Visibility Tag */}
                        <span className="text-[11px] sm:text-xs">
                          {auc.visibility === "PRIVATE" ? (
                            <span className="text-[#f59e0b] flex items-center gap-1">
                              <Lock className="size-3" />
                              <span>Private</span>
                            </span>
                          ) : (
                            <span className="text-[#10b981] flex items-center gap-1 font-medium">
                              <span>Public</span>
                            </span>
                          )}
                        </span>

                        {/* Status if DRAFT / LIVE */}
                        {auc.status === "DRAFT" && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono border border-amber-500/40 text-amber-300 bg-amber-500/10">
                            DRAFT
                          </span>
                        )}
                        {auc.status === "LIVE" && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono border border-rose-500/40 text-rose-300 bg-rose-500/10 flex items-center gap-1 animate-pulse">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            <span>LIVE</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: 3 Circular Buttons like the screenshot */}
                  <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center shrink-0">
                    {/* 1. Share Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareAuction(auc);
                      }}
                      className="size-9 sm:size-9.5 rounded-full bg-[#03141b] border border-[#0b3846] hover:border-[#00d2ee] hover:bg-[#00d2ee]/15 text-[#7aa2b0] hover:text-[#00d2ee] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      title="Share auction link"
                    >
                      <Share2 className="size-3.5" />
                    </button>

                    {/* 2. Edit / Enter Floor Button */}
                    {currentUser?.role === "ADMIN" || auc.ownerId?._id === currentUser?.id || (typeof auc.ownerId === "string" && auc.ownerId === currentUser?.id) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAuctionToEdit(auc);
                          setCreateModalOpen(true);
                        }}
                        className="size-9 sm:size-9.5 rounded-full bg-[#03141b] border border-[#0b3846] hover:border-[#10b981] hover:bg-[#10b981]/15 text-[#7aa2b0] hover:text-[#10b981] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Edit auction profile & dynamic forms"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    ) : (
                      <Link
                        href={targetUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="size-9 sm:size-9.5 rounded-full bg-[#03141b] border border-[#0b3846] hover:border-[#10b981] hover:bg-[#10b981]/15 text-[#7aa2b0] hover:text-[#10b981] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Enter auction bidding arena"
                      >
                        <Eye className="size-3.5" />
                      </Link>
                    )}

                    {/* 3. Delete Button (for Admins or Owners) */}
                    {(currentUser?.role === "ADMIN" || auc.ownerId?._id === currentUser?.id) ? (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAuction(auc._id, auc.name, e)}
                        className="size-9 sm:size-9.5 rounded-full bg-[#03141b] border border-[#0b3846] hover:border-[#ef4444] hover:bg-[#ef4444]/15 text-[#7aa2b0] hover:text-[#ef4444] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Delete / cancel auction"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : auc.visibility === "PRIVATE" && auc.userAccessStatus !== "APPROVED" ? (
                      <button
                        type="button"
                        onClick={(e) => handleRequestAccess(auc._id, e)}
                        className="px-3 py-1.5 rounded-full bg-[#03141b] border border-[#0b3846] hover:border-[#f59e0b] text-[#f59e0b] text-xs flex items-center gap-1 transition-all"
                        title="Request Private Access"
                      >
                        <Lock className="size-3" />
                        <span>Request</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create / Edit Auction Modal */}
      <CreateAuctionModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setAuctionToEdit(null);
        }}
        token={token || getStoredToken() || ""}
        auctionToEdit={auctionToEdit}
        onSuccess={(updatedAuction) => {
          const wasEditing = Boolean(auctionToEdit);
          setCreateModalOpen(false);
          setAuctionToEdit(null);
          showNotice(
            "success",
            wasEditing
              ? `Tournament "${updatedAuction.name}" updated successfully!`
              : `Tournament "${updatedAuction.name}" created successfully!`
          );
          loadAuctions();
        }}
      />

      {/* Share Dialog */}
      <ShareAuctionDialog
        isOpen={!!shareAuction}
        onClose={() => setShareAuction(null)}
        auction={shareAuction}
      />
    </div>
  );
}
