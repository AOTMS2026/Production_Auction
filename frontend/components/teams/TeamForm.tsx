"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Upload, Camera, AlertCircle } from "lucide-react";
import { Team } from "@/types/auction";

interface TeamFormProps {
  isOpen: boolean;
  auctionId: string;
  teamToEdit?: Team | null;
  defaultPurse: number;
  defaultMaxPlayers: number;
  onClose: () => void;
  onSubmit: (payload: Partial<Team>) => Promise<void>;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  isOpen,
  teamToEdit,
  defaultPurse,
  defaultMaxPlayers,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(teamToEdit);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logo, setLogo] = useState("");
  const [purseTotal, setPurseTotal] = useState<number>(defaultPurse);
  const [maxPlayers, setMaxPlayers] = useState<number>(defaultMaxPlayers);
  const [ownerName, setOwnerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (teamToEdit) {
      setName(teamToEdit.name || "");
      setShortName(teamToEdit.shortName || teamToEdit.code || "");
      setLogo(teamToEdit.logo || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200");
      setPurseTotal(teamToEdit.purseTotal ?? defaultPurse);
      setMaxPlayers(teamToEdit.maxPlayers ?? defaultMaxPlayers);
      setOwnerName(teamToEdit.ownerName || "");
      setContactEmail(teamToEdit.contactEmail || "");
    } else {
      setName("");
      setShortName("");
      setLogo("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200");
      setPurseTotal(defaultPurse);
      setMaxPlayers(defaultMaxPlayers);
      setOwnerName("");
      setContactEmail("");
    }
    setError(null);
  }, [isOpen, teamToEdit, defaultPurse, defaultMaxPlayers]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("Logo image size cannot exceed 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Team Name is required.");
      return;
    }
    if (!shortName.trim()) {
      setError("Short Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        code: shortName.trim().toUpperCase(),
        shortName: shortName.trim().toUpperCase(),
        logo: logo.trim(),
        purseTotal: Number(purseTotal) || defaultPurse,
        maxPlayers: Number(maxPlayers) || defaultMaxPlayers,
        ownerName: ownerName.trim(),
        contactEmail: contactEmail.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save team details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#02131b] border border-[#0d3f4f] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0d3f4f] shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-mono font-medium text-white tracking-wide uppercase">
              {isEditing ? "Edit Team Details" : "Create New Team"}
            </h3>
            <p className="text-xs text-[#7fa3b0] mt-0.5">
              {isEditing
                ? "Update franchise information, crest, and budget"
                : "Register a franchise team to participate in this auction"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7fa3b0] hover:text-white hover:bg-[#072433] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 mt-4">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
            {/* Team Crest / Logo Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#87c2fd] uppercase tracking-wider block">
                Team Logo / Crest <span className="text-[#f97316]">*</span>
              </label>
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#031822] border border-[#0d3f4f]">
                <div className="relative size-16 rounded-2xl overflow-hidden bg-[#06151f] border border-[#1e485e] shrink-0 shadow-inner">
                  <Image
                    src={logo || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200"}
                    alt="Team Logo"
                    fill
                    className="object-cover"
                    unoptimized={logo.startsWith("data:")}
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00d2ee]/15 hover:bg-[#00d2ee]/25 border border-[#00d2ee]/50 text-xs font-mono font-medium text-[#00d2ee] transition-all cursor-pointer"
                    >
                      <Camera className="size-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    <span className="text-[11px] text-[#7fa3b0]">PNG, JPG up to 8MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Name & Short Name in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-[#87c2fd]">
                  Team Name <span className="text-[#f97316]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Springfield Squad"
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#87c2fd]">
                  Short Name <span className="text-[#f97316]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  placeholder="e.g. SF"
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase font-mono outline-none transition-all"
                />
              </div>
            </div>

            {/* Total Points & Max Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#87c2fd]">
                  Total Points / Purse <span className="text-[#f97316]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={purseTotal}
                  onChange={(e) => setPurseTotal(parseInt(e.target.value, 10))}
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#87c2fd]">
                  Total Player Slots <span className="text-[#f97316]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono outline-none transition-all"
                />
              </div>
            </div>

            {/* Optional Owner & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#7fa3b0]">Owner / Manager (Optional)</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#7fa3b0]">Contact Email (Optional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="w-full bg-[#031822] border border-[#0d3f4f] focus:border-[#00d2ee] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Actions - Fixed Bottom */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0d3f4f] mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-medium text-[#7fa3b0] hover:text-white bg-[#031822] hover:bg-[#042433] border border-[#0d3f4f] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#00d2ee] hover:bg-[#00b8d4] text-[#02131b] font-mono font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="size-3.5 border-2 border-[#02131b] border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{isEditing ? "Save Changes" : "Create Team"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
