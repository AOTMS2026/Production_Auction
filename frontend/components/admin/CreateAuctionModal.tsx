"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Calendar,
  Clock,
  Users,
  Coins,
  ArrowUpRight,
  Shield,
  Eye,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createAuction,
  updateAuction,
  type SportType,
  type AuctionVisibility,
  type Auction,
} from "@/lib/api";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/Form";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: (newAuction: Auction) => void;
  auctionToEdit?: Auction | null;
}

const SPORTS: { label: string; value: SportType; icon: string }[] = [
  { label: "Cricket", value: "CRICKET", icon: "🏏" },
  { label: "Volleyball", value: "VOLLEYBALL", icon: "🏐" },
  { label: "Football", value: "FOOTBALL", icon: "⚽" },
  { label: "Kabaddi", value: "KABADDI", icon: "🤼" },
  { label: "Badminton", value: "BADMINTON", icon: "🏸" },
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1531415074868-83633dd5e45c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
];

export function CreateAuctionModal({
  isOpen,
  onClose,
  token,
  onSuccess,
  auctionToEdit,
}: CreateAuctionModalProps) {
  const isEdit = Boolean(auctionToEdit);

  const [name, setName] = useState("");
  const [sport, setSport] = useState<SportType>("CRICKET");
  const [image, setImage] = useState(PRESET_COVERS[0]);
  const [auctionDate, setAuctionDate] = useState("2026-10-20");
  const [auctionTime, setAuctionTime] = useState("18:00");
  const [timezone, setTimezone] = useState("IST (UTC+5:30)");
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(15);
  const [pointsBalancePerTeam, setPointsBalancePerTeam] = useState<number>(100000);
  const [minimumBid, setMinimumBid] = useState<number>(500);
  const [maximumBid, setMaximumBid] = useState<number>(20000);
  const [bidIncrement, setBidIncrement] = useState<number>(500);
  const [visibility, setVisibility] = useState<AuctionVisibility>("PUBLIC");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (auctionToEdit) {
        setName(auctionToEdit.name || "");
        setSport(auctionToEdit.sport || "CRICKET");
        setImage(auctionToEdit.image?.url || PRESET_COVERS[0]);
        if (auctionToEdit.scheduledAt) {
          try {
            const d = new Date(auctionToEdit.scheduledAt);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              setAuctionDate(`${yyyy}-${mm}-${dd}`);
              const hh = String(d.getHours()).padStart(2, "0");
              const min = String(d.getMinutes()).padStart(2, "0");
              setAuctionTime(`${hh}:${min}`);
            }
          } catch {
            // fallback
          }
        }
        setTimezone(auctionToEdit.timezone || "IST (UTC+5:30)");
        setPlayersPerTeam(auctionToEdit.playersPerTeam ?? 15);
        setPointsBalancePerTeam(auctionToEdit.pointsBalancePerTeam ?? 100000);
        setMinimumBid(auctionToEdit.minimumBid ?? 500);
        setMaximumBid(auctionToEdit.maximumBid ?? 20000);
        setBidIncrement(auctionToEdit.bidIncrement ?? 500);
        setVisibility(auctionToEdit.visibility || "PUBLIC");
        setErrorMsg(null);
      } else {
        setName("");
        setSport("CRICKET");
        setImage(PRESET_COVERS[0]);
        try {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setAuctionDate(tomorrow.toISOString().split("T")[0]);
        } catch {
          // fallback
        }
        setAuctionTime("18:00");
        setTimezone("IST (UTC+5:30)");
        setPlayersPerTeam(15);
        setPointsBalancePerTeam(100000);
        setMinimumBid(500);
        setMaximumBid(20000);
        setBidIncrement(500);
        setVisibility("PUBLIC");
        setErrorMsg(null);
      }
    }
  }, [isOpen, auctionToEdit]);

  // Auto-calculate Maximum Bid based on: purse - ((playersPerTeam - 1) * minimumBid)
  React.useEffect(() => {
    const minBid = Number(minimumBid) || 0;
    const players = Number(playersPerTeam) || 0;
    const purse = Number(pointsBalancePerTeam) || 0;

    if (players > 1 && purse > 0 && minBid >= 0) {
      // Remaining players need at least minimum bid each
      const reservedForRest = (players - 1) * minBid;
      const calculatedMax = Math.max(minBid, purse - reservedForRest);
      setMaximumBid(calculatedMax);
    } else if (players === 1 && purse > 0) {
      setMaximumBid(purse);
    }
  }, [pointsBalancePerTeam, playersPerTeam, minimumBid]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!name.trim()) {
      setErrorMsg("Auction name is required.");
      return;
    }
    if (!image) {
      setErrorMsg("Auction cover image is required.");
      return;
    }
    if (maximumBid < minimumBid) {
      setErrorMsg("Maximum bid must be greater than or equal to minimum bid.");
      return;
    }

    const combinedDateTime = new Date(`${auctionDate}T${auctionTime}:00`);
    if (isNaN(combinedDateTime.getTime())) {
      setErrorMsg("Please provide a valid date and time.");
      return;
    }

    setLoading(true);
    try {
      if (auctionToEdit?._id) {
        const res = await updateAuction(
          auctionToEdit._id,
          {
            name: name.trim(),
            sport,
            image,
            scheduledAt: combinedDateTime.toISOString(),
            timezone,
            playersPerTeam: Number(playersPerTeam),
            pointsBalancePerTeam: Number(pointsBalancePerTeam),
            minimumBid: Number(minimumBid),
            maximumBid: Number(maximumBid),
            bidIncrement: Number(bidIncrement),
            visibility,
          },
          token
        );

        if (res.data) {
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await createAuction(
          {
            name: name.trim(),
            sport,
            image,
            scheduledAt: combinedDateTime.toISOString(),
            timezone,
            playersPerTeam: Number(playersPerTeam),
            pointsBalancePerTeam: Number(pointsBalancePerTeam),
            minimumBid: Number(minimumBid),
            maximumBid: Number(maximumBid),
            bidIncrement: Number(bidIncrement),
            visibility,
          },
          token
        );

        if (res.data) {
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isEdit ? "Failed to update auction." : "Failed to create auction."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#001439] border border-[#023e7d] shadow-[0_0_60px_rgba(4,102,200,0.4)] p-6 sm:p-8 text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header - Fixed Top */}
        <div className="flex items-center justify-between pb-4 border-b border-[#023e7d]/60 mb-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0466c8]/20 border border-[#0466c8]/40 text-[#87c2fd] text-xs font-normal mb-2">
              <Shield className="size-3.5 text-[#f97316]" />
              <span>{isEdit ? "Update Auction Details" : "Admin Management Module"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-white">
              {isEdit ? "Edit Sports Auction" : "Create Sports Auction"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#979dac] hover:text-white hover:bg-[#002855] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-normal flex items-start gap-2.5 shrink-0">
            <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Form Content Fields */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-3.5 custom-scrollbar">
            <FieldGroup className="gap-6 pb-2">
            {/* Section 1: Basic Information */}
            <FieldSet>
              <FieldLegend className="text-sm font-normal text-[#87c2fd] uppercase tracking-wider">
                1. Basic Information
              </FieldLegend>
              <FieldGroup className="gap-4">
                {/* Auction Name */}
                <Field>
                  <FieldLabel htmlFor="create-auc-name">
                    Auction Name <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Premier Cricket Championship 2026"
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>

                {/* Sport Dropdown (5 supported sports) */}
                <Field>
                  <FieldLabel>
                    Sport Category <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SPORTS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSport(s.value)}
                        className={`p-2.5 rounded-xl border text-xs font-normal flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          sport === s.value
                            ? "bg-[#0466c8] border-[#f97316] text-white shadow-md"
                            : "bg-[#001233] border-[#023e7d] text-[#dee0e6] hover:bg-[#001845]"
                        }`}
                      >
                        <span className="text-lg">{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Cover Image Upload / Selection */}
                <Field>
                  <FieldLabel>
                    Auction Cover Image <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#001233] border border-[#023e7d]">
                    <div className="relative size-16 rounded-xl overflow-hidden bg-[#001845] shrink-0 border border-[#023e7d]">
                      <img src={image} alt="Cover Preview" className="size-full object-cover" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001845] hover:bg-[#022950] border border-[#023e7d] text-xs font-normal text-white cursor-pointer"
                        >
                          <Camera className="size-3.5 text-[#87c2fd]" />
                          <span>Upload Device Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            {/* Section 2: Schedule */}
            <FieldSet>
              <FieldLegend className="text-sm font-normal text-[#87c2fd] uppercase tracking-wider">
                2. Schedule & Timing
              </FieldLegend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="create-auc-date">
                    Auction Date <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-date"
                    type="date"
                    required
                    value={auctionDate}
                    onChange={(e) => setAuctionDate(e.target.value)}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="create-auc-time">
                    Auction Time <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-time"
                    type="time"
                    required
                    value={auctionTime}
                    onChange={(e) => setAuctionTime(e.target.value)}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Section 3: Team and Points Configuration */}
            <FieldSet>
              <FieldLegend className="text-sm font-normal text-[#87c2fd] uppercase tracking-wider">
                3. Team & Budget Configuration
              </FieldLegend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="create-auc-players-team">
                    Players Per Team <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-players-team"
                    type="number"
                    min={1}
                    required
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(parseInt(e.target.value, 10))}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="create-auc-purse">
                    Points Balance / Team Purse <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-purse"
                    type="number"
                    min={1}
                    required
                    value={pointsBalancePerTeam}
                    onChange={(e) => setPointsBalancePerTeam(parseInt(e.target.value, 10))}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Section 4: Bidding Rules */}
            <FieldSet>
              <FieldLegend className="text-sm font-normal text-[#87c2fd] uppercase tracking-wider">
                4. Bidding Limits & Increments
              </FieldLegend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="create-auc-min-bid">
                    Minimum Bid <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-min-bid"
                    type="number"
                    min={1}
                    required
                    value={minimumBid}
                    onChange={(e) => setMinimumBid(parseInt(e.target.value, 10))}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="create-auc-max-bid">
                      Maximum Bid <span className="text-[#f97316]">*</span>
                    </FieldLabel>
                   
                  </div>
                  <input
                    id="create-auc-max-bid"
                    type="number"
                    min={1}
                    required
                    value={maximumBid}
                    onChange={(e) => setMaximumBid(parseInt(e.target.value, 10))}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                  <FieldDescription className="text-[11px] text-[#7aa2b0] mt-1">
                    Purse - ({playersPerTeam > 1 ? `${playersPerTeam - 1}` : "0"} × Min Bid)
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="create-auc-increment">
                    Increased By <span className="text-[#f97316]">*</span>
                  </FieldLabel>
                  <input
                    id="create-auc-increment"
                    type="number"
                    min={1}
                    required
                    value={bidIncrement}
                    onChange={(e) => setBidIncrement(parseInt(e.target.value, 10))}
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white outline-none transition-all"
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Section 5: Visibility & Access */}
            <FieldSet>
              <FieldLegend className="text-sm font-normal text-[#87c2fd] uppercase tracking-wider">
                5. Auction Visibility
              </FieldLegend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setVisibility("PUBLIC")}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    visibility === "PUBLIC"
                      ? "bg-[#002855] border-[#0466c8] shadow-md"
                      : "bg-[#001233] border-[#023e7d] opacity-75 hover:opacity-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PUBLIC"}
                    onChange={() => setVisibility("PUBLIC")}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-normal text-white">
                      <Eye className="size-4 text-[#87c2fd]" />
                      <span>Public Auction</span>
                    </div>
                    <FieldDescription className="mt-1 leading-relaxed">
                      Listed publicly on tournament schedule. Anyone can discover and view lots.
                    </FieldDescription>
                  </div>
                </label>

                <label
                  onClick={() => setVisibility("PRIVATE")}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    visibility === "PRIVATE"
                      ? "bg-[#002855] border-[#f97316] shadow-md"
                      : "bg-[#001233] border-[#023e7d] opacity-75 hover:opacity-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PRIVATE"}
                    onChange={() => setVisibility("PRIVATE")}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-normal text-white">
                      <Lock className="size-4 text-[#f97316]" />
                      <span>Private (Invite Only)</span>
                    </div>
                    <FieldDescription className="mt-1 leading-relaxed">
                      Hidden from public listings. Requires invitation or administrator access approval.
                    </FieldDescription>
                  </div>
                </label>
              </div>
            </FieldSet>
          </FieldGroup>
        </div>

        {/* Form Actions - Fixed Bottom */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#023e7d]/50 mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#023e7d] bg-[#001845] hover:bg-[#022950] text-[#c3e0fe] text-sm font-normal transition-colors cursor-pointer"
          >
            Cancel
          </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white text-sm font-normal shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEdit ? "Save Changes" : "Save & Create Draft"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
