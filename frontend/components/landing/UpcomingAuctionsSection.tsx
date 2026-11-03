"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  Coins,
  Bell,
  ArrowRight,
  Filter,
} from "lucide-react";

export function UpcomingAuctionsSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  const auctions = [
    {
      id: "up-1",
      title: "Cyberabad Champions Trophy 2026",
      sport: "Cricket",
      date: "Tomorrow, 10:00 AM IST",
      totalPurse: "₹ 50,00,000",
      teamsRegistered: 8,
      maxTeams: 8,
      status: "Registration Closed",
      statusColor: "border-amber-500/50 bg-amber-950/40 text-amber-300",
      category: "cricket",
    },
    {
      id: "up-2",
      title: "Telangana State Football League",
      sport: "Football",
      date: "Oct 16, 2026 • 02:00 PM",
      totalPurse: "₹ 25,00,000",
      teamsRegistered: 10,
      maxTeams: 12,
      status: "2 Slots Remaining",
      statusColor: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300",
      category: "football",
    },
    {
      id: "up-3",
      title: "Inter-Corporate Badminton Championship",
      sport: "Badminton",
      date: "Oct 18, 2026 • 11:30 AM",
      totalPurse: "₹ 12,00,000",
      teamsRegistered: 6,
      maxTeams: 8,
      status: "Open Registration",
      statusColor: "border-[#0466c8]/50 bg-[#002855] text-[#87c2fd]",
      category: "badminton",
    },
    {
      id: "up-4",
      title: "AOTMS National Esports Syndicate",
      sport: "Esports",
      date: "Oct 22, 2026 • 06:00 PM",
      totalPurse: "₹ 35,00,000",
      teamsRegistered: 14,
      maxTeams: 16,
      status: "Filling Fast",
      statusColor: "border-purple-500/50 bg-purple-950/40 text-purple-300",
      category: "esports",
    },
  ];

  const filtered = activeCategory === "all" ? auctions : auctions.filter((a) => a.category === activeCategory);

  return (
    <section id="upcoming-auctions" className="py-20 bg-[#001845] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#023e7d]/60 border border-[#0466c8]/40 text-[#87c2fd] text-sm font-normal mb-3">
              <Calendar className="size-4" />
              <span>Scheduled Broadcasts</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
              Upcoming Tournaments & Auctions
            </h2>
            <p className="mt-2 text-base sm:text-lg font-normal text-[#979dac] max-w-xl">
              Register team franchises, configure purse caps, or reserve spectator access before gavel strike.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#001233]/70 rounded-xl border border-[#023e7d]/50">
            {["all", "cricket", "football", "badminton", "esports"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-normal capitalize transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#0466c8] to-[#0f85fa] text-white shadow-sm"
                    : "text-[#979dac] hover:text-white hover:bg-[#002855]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="border-[#023e7d] bg-[#002045]/70 hover:bg-[#002855] backdrop-blur-md rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#0466c8]/70 shadow-[0_10px_30px_rgba(0,18,51,0.5)] flex flex-col justify-between p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className="border-[#0466c8]/40 bg-[#001233] text-[#87c2fd] text-xs font-normal">
                    {item.sport}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-normal px-2 py-0.5 ${item.statusColor}`}>
                    {item.status}
                  </Badge>
                </div>

                <h3 className="text-base font-normal text-white leading-snug mb-3">
                  {item.title}
                </h3>

                <div className="space-y-2 text-xs font-normal text-[#979dac] mb-5">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-[#4ba3fb]" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="size-3.5 text-emerald-400" />
                    <span>Purse: <span className="text-[#dee0e6]">{item.totalPurse}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-[#87c2fd]" />
                    <span>Franchises: <span className="text-[#dee0e6]">{item.teamsRegistered}/{item.maxTeams}</span></span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-[#023e7d]/40 flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full border-[#023e7d] bg-[#001233]/70 hover:bg-[#0466c8] text-[#c3e0fe] hover:text-white font-normal text-sm h-10 rounded-xl flex items-center justify-center gap-2 transition-all"
                  asChild
                >
                  <a href="#register">
                    <span>Register Team</span>
                    <ArrowRight className="size-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="text-[#979dac] hover:text-white hover:bg-[#022950] px-3 h-10 rounded-xl shrink-0"
                  title="Notify Me"
                >
                  <Bell className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UpcomingAuctionsSection;
