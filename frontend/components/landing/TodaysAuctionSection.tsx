"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Radio,
  Flame,
  Timer,
  Users,
  QrCode,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";

interface LiveAuctionProps {
  onEnterArena?: () => void;
}

export function TodaysAuctionSection({ onEnterArena }: LiveAuctionProps) {
  const [currentBid, setCurrentBid] = useState(85000);
  const [leadingTeam, setLeadingTeam] = useState("Sambhav Strikers");

  const quickBid = (inc: number) => {
    setCurrentBid((prev) => prev + inc);
  };

  return (
    <section id="todays-auction" className="relative py-20 bg-[#001233] text-white overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#0466c8]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-[#023e7d]/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 border-b border-[#023e7d]/40 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-normal mb-3">
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Broadcast Node Active</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
              Today's Live Auction
            </h2>
            <p className="mt-2 text-base sm:text-lg font-normal text-[#979dac] max-w-xl">
              Real-time synchronisation across auctioneer desks, team franchises, and spectator screens.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge
              variant="outline"
              className="border-[#0466c8]/50 bg-[#001845] text-[#87c2fd] px-3.5 py-1.5 text-xs sm:text-sm font-normal flex items-center gap-1.5"
            >
              <Timer className="size-4 text-[#4ba3fb]" />
              <span>Round 2 of 4</span>
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 px-3.5 py-1.5 text-xs sm:text-sm font-normal flex items-center gap-1.5"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>4 Teams Active</span>
            </Badge>
          </div>
        </div>

        {/* Live Arena Spotlight Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Player On Podium */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className="flex-1 border-[#023e7d] bg-[#001845]/90 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,18,51,0.7)] rounded-2xl overflow-hidden p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#022950] border border-[#0466c8]/40 text-[#87c2fd] text-xs font-normal">
                      Lot #17
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#33415c]/40 text-[#dee0e6] text-xs font-normal">
                      All-Rounder • Grade A
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-normal text-[#979dac]">
                    <Radio className="size-3.5 text-rose-400 animate-pulse" />
                    <span>Live Floor</span>
                  </div>
                </div>

                {/* Player Profile & Bid Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-4">
                  <div className="sm:col-span-5 flex flex-col items-center">
                    <div className="relative size-36 sm:size-40 rounded-2xl overflow-hidden border-2 border-[#0466c8]/50 bg-[#002855] shadow-lg flex items-center justify-center">
                      <div className="text-center p-4">
                        <Award className="size-10 text-[#4ba3fb] mx-auto mb-2 opacity-80" />
                        <span className="text-xs font-normal text-[#c3e0fe]">M. SRIKANTH</span>
                        <p className="text-[11px] font-normal text-[#7d8597] mt-1">Right Hand Bat</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs font-normal text-[#7d8597]">
                      <span>Age: 38</span>
                      <span>•</span>
                      <span>Matches: 142</span>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex flex-col justify-center space-y-4">
                    <div className="bg-[#001233]/80 border border-[#023e7d]/60 rounded-xl p-4">
                      <span className="text-xs font-normal text-[#7d8597] uppercase tracking-wider block">
                        Current Highest Bid
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-normal text-emerald-400">
                          🪙 {currentBid.toLocaleString()}
                        </span>
                        <span className="text-xs font-normal text-[#979dac]">Base: 5,000</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-[#023e7d]/40 text-xs font-normal text-[#c3e0fe]">
                        <span className="text-[#7d8597]">Leading Team:</span>
                        <span className="text-[#87c2fd] underline decoration-[#0466c8]">{leadingTeam}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[#002045]/60 border border-[#023e7d]/30">
                        <span className="text-[11px] font-normal text-[#7d8597] block">Bids Placed</span>
                        <span className="text-sm font-normal text-[#dee0e6]">18</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#002045]/60 border border-[#023e7d]/30">
                        <span className="text-[11px] font-normal text-[#7d8597] block">Floor Cap</span>
                        <span className="text-sm font-normal text-[#dee0e6]">🪙 1,15,000</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#002045]/60 border border-[#023e7d]/30">
                        <span className="text-[11px] font-normal text-[#7d8597] block">Pace</span>
                        <span className="text-sm font-normal text-amber-400">High Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#023e7d]/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => quickBid(5000)}
                    className="border-[#0466c8]/50 bg-[#002855] text-[#87c2fd] hover:bg-[#023d78] font-normal text-sm px-4 py-2 h-10 rounded-xl"
                  >
                    +5,000 Raise
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => quickBid(10000)}
                    className="border-[#0466c8]/50 bg-[#002855] text-[#87c2fd] hover:bg-[#023d78] font-normal text-sm px-4 py-2 h-10 rounded-xl"
                  >
                    +10,000 Raise
                  </Button>
                </div>

                <Button
                  className="bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-sm sm:text-base px-6 py-2.5 h-11 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.35)] border border-white/20"
                  asChild
                >
                  <a href="#auth">
                    <span>Enter Live Console</span>
                    <ArrowRight className="size-4.5" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>

          {/* Participating Teams & Spectator Arena Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="border-[#023e7d] bg-[#001845]/80 backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-normal text-[#7d8597] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="size-3.5 text-[#4ba3fb]" />
                    <span>Competing Franchise Purse</span>
                  </span>
                  <span className="text-[11px] font-normal text-[#4ba3fb]">13 Slots Target</span>
                </div>

                <ScrollArea className="h-56 pr-2">
                  <div className="space-y-2.5">
                    {[
                      { name: "Springfield Squad", purse: "1.15L", max: "55K", squad: "0/13", status: "Active" },
                      { name: "Sreshta Smashers", purse: "1.15L", max: "55K", squad: "0/13", status: "Active" },
                      { name: "Sambhav Strikers", purse: "1.15L", max: "55K", squad: "0/13", status: "Active" },
                      { name: "Bhavani Blasters", purse: "0", max: "0", squad: "2/13", status: "Exhausted" },
                    ].map((team) => (
                      <div
                        key={team.name}
                        onClick={() => setLeadingTeam(team.name)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          team.status === "Exhausted"
                            ? "border-rose-500/40 bg-[#1e171b]/80 text-[#979dac]"
                            : leadingTeam === team.name
                            ? "border-[#0466c8] bg-[#022950] text-white shadow-[0_0_15px_rgba(4,102,200,0.3)]"
                            : "border-[#023e7d]/40 bg-[#002045]/60 hover:border-[#0466c8]/60 text-[#dee0e6]"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-normal">{team.name}</p>
                          <p className="text-[10px] font-normal text-[#7d8597] mt-0.5">
                            Squad: {team.squad} • Left: {13 - parseInt(team.squad.split("/")[0])}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-normal ${team.status === "Exhausted" ? "text-rose-400" : "text-emerald-400"}`}>
                            🪙 {team.purse}
                          </span>
                          <span className="block text-[10px] font-normal text-[#979dac]">
                            Max: {team.max}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Instant Spectator Check-in QR Prompt */}
              <div className="mt-4 pt-3 border-t border-[#023e7d]/40 flex items-center justify-between bg-[#001233]/70 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-lg bg-[#023d78] flex items-center justify-center text-[#87c2fd]">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-normal text-white block">Public Spectator Mode</span>
                    <span className="text-[11px] font-normal text-[#7d8597]">Scan QR to watch live bids without login</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-[#0466c8]/60 bg-[#022950] text-[#c3e0fe] hover:bg-[#0352a0] text-sm font-normal px-4.5 py-2 h-9.5 rounded-xl"
                  asChild
                >
                  <a href="#spectator">Watch Live</a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TodaysAuctionSection;
