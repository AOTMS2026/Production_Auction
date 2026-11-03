"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Team } from "@/types/auction";
import { TeamMenu } from "./TeamMenu";

interface TeamCardProps {
  team: Team;
  isAdmin?: boolean;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
}

// Format numbers into clean representation (e.g. 115000 -> 1.15L or locale string)
function formatPoints(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `${cr % 1 === 0 ? cr : cr.toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `${l % 1 === 0 ? l : l.toFixed(2)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return amount.toLocaleString();
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);

  // Statistics derived from authoritative team data
  const totalSlots = team.maxPlayers || 15;
  const registeredCount = team.registeredPlayersCount ?? team.resPl ?? team.playersCount ?? 0;
  const usedPts = team.usedPoints ?? team.usedPts ?? Math.max(0, (team.purseTotal || 0) - (team.purseRemaining || 0));
  const maxBid = team.maxBid !== undefined ? team.maxBid : 0;
  const totalPoints = team.totalPoints ?? team.purseTotal ?? 0;

  const shortName = team.shortName || team.code || "TM";
  const defaultLogo = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200";
  const logoSrc = imageError || !team.logo ? defaultLogo : team.logo;

  return (
    <div className="relative group rounded-[22px] bg-[#0c2331]/90 hover:bg-[#0e2a3b] border border-[#1b3e52] hover:border-[#00d2ee]/60 transition-all duration-300 p-4 sm:p-5 shadow-lg flex flex-col justify-between gap-3 text-white overflow-hidden">
      {/* Three-dot menu for Admins */}
      {isAdmin && (
        <div className="absolute top-3.5 right-3.5 z-20">
          <TeamMenu
            onEdit={() => onEdit?.(team)}
            onDelete={() => onDelete?.(team)}
          />
        </div>
      )}

      {/* Top Row: Team Crest + Identity (Left) & Total Points Metric (Right) */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Crest & Names */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Logo Frame matching image: rounded square with subtle border & background */}
          <div className="relative size-14 sm:size-16 rounded-2xl overflow-hidden bg-[#06151f] border border-[#1e485e] shrink-0 shadow-inner flex items-center justify-center">
            <Image
              src={logoSrc}
              alt={team.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized={logoSrc.startsWith("data:")}
            />
          </div>

          {/* Name & Short Name */}
          <div className="min-w-0 flex flex-col justify-center">
            <h3
              className="text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-[220px]"
              title={team.name}
            >
              {team.name}
            </h3>
            <span className="text-xs font-semibold text-[#6d92a5] uppercase tracking-wider font-mono">
              {shortName}
            </span>
          </div>
        </div>

        {/* Right: Total Points (matching screenshot: e.g. "1.15L" + "TOTAL POINTS" below) */}
        <div className={`text-right shrink-0 ${isAdmin ? "mr-7" : ""}`}>
          <div className="text-lg sm:text-xl font-extrabold text-[#7fa7bc] font-mono tracking-tight leading-none">
            {formatPoints(totalPoints)}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold text-[#567a8c] uppercase tracking-wider mt-1">
            TOTAL POINTS
          </div>
        </div>
      </div>

      {/* Bottom Grid: 4 Metric Columns separated by clean vertical dividers */}
      <div className="pt-2 border-t border-[#143445]/70 grid grid-cols-4 items-center text-left">
        {/* 1. TOTAL PL */}
        <div className="pr-2 border-r border-[#1e4458]/70">
          <div className="text-[10px] sm:text-[11px] font-semibold text-[#668b9e] uppercase tracking-wider">
            TOTAL PL
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
            {registeredCount} / {totalSlots}
          </div>
        </div>

        {/* 2. RES. PL */}
        <div className="px-2.5 border-r border-[#1e4458]/70">
          <div className="text-[10px] sm:text-[11px] font-semibold text-[#668b9e] uppercase tracking-wider">
            RES. PL
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
            {String(registeredCount).padStart(2, "0")}
          </div>
        </div>

        {/* 3. USED PTS */}
        <div className="px-2.5 border-r border-[#1e4458]/70">
          <div className="text-[10px] sm:text-[11px] font-semibold text-[#668b9e] uppercase tracking-wider">
            USED PTS
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-[#38e1a8] font-mono mt-0.5">
            {formatPoints(usedPts)}
          </div>
        </div>

        {/* 4. MAX BID */}
        <div className="pl-2.5">
          <div className="text-[10px] sm:text-[11px] font-semibold text-[#668b9e] uppercase tracking-wider">
            MAX BID
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
            {formatPoints(maxBid)}
          </div>
        </div>
      </div>
    </div>
  );
};
