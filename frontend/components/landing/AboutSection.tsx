"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Cpu,
  BarChart3,
  Award,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function AboutSection() {
  const stats = [
    { label: "Bids Transacted", value: "₹ 45 Cr+", desc: "Zero financial discrepancies" },
    { label: "Player Lots Managed", value: "10,200+", desc: "Across 4 professional sports" },
    { label: "Real-Time Telemetry", value: "< 80 ms", desc: "Global WebSocket latency" },
    { label: "Uptime SLA", value: "99.98%", desc: "High-availability clustering" },
  ];

  const highlights = [
    {
      title: "Strict Mathematical Safeguards",
      desc: "Guarantees every team preserves minimum points for unfilled roster slots, preventing accidental overspending or auction stalls.",
    },
    {
      title: "Zero-Barrier QR Spectator Mode",
      desc: "Fans and team supporters can scan a simple venue QR code to track live bids on their phones without requiring logins or credentials.",
    },
    {
      title: "Instant Financial Reconciliation",
      desc: "Automatically deducts sold prices, locks reserve budgets, and generates audit-ready PDF reports with player photos and team ledgers.",
    },
    {
      title: "Multi-Sport Customization",
      desc: "Configurable roles, grade multipliers, base prices, and stats tailored for Cricket, Football, Badminton, and Esports tournaments.",
    },
  ];

  return (
    <section id="about" className="py-24 bg-[#001233] text-white relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#023e7d]/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-[#0466c8]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Tag & Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge
            variant="outline"
            className="border-[#0466c8]/50 bg-[#001845] text-[#87c2fd] px-4 py-1.5 text-sm font-normal mb-3"
          >
            Built for High-Stakes Tournaments
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
            Engineering Precision & Transparency for Live Auctions
          </h2>
          <p className="mt-4 text-base sm:text-lg font-normal text-[#979dac] leading-relaxed">
            AOTMS provides the technological backbone for sports franchises, clubs, and athletic leagues.
            We eliminate manual ledger errors, eliminate bidding latency, and enforce mathematical purse compliance in real time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 sm:p-7 rounded-2xl bg-[#001845]/70 border border-[#023e7d] backdrop-blur-md text-center hover:border-[#0466c8]/60 transition-colors"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#87c2fd] tracking-tight">
                {stat.value}
              </div>
              <div className="mt-2 text-base font-normal text-white">{stat.label}</div>
              <div className="mt-1 text-xs sm:text-sm font-normal text-[#7d8597]">{stat.desc}</div>
            </div>
          ))}
        </div>

        {/* Two-Column Feature Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Visual Architecture Card */}
          <div className="lg:col-span-6">
            <Card className="border-[#023e7d] bg-gradient-to-br from-[#001845] via-[#002045] to-[#002855] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#0466c8]/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="size-11 rounded-xl bg-[#0466c8]/20 border border-[#0466c8]/50 flex items-center justify-center text-[#87c2fd]">
                  <Cpu className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-white">AOTMS Auction Cloud Core</h3>
                  <p className="text-xs font-normal text-[#979dac]">Distributed WebSocket Architecture</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#001233]/70 border border-[#023e7d]/60 flex items-start gap-3">
                  <Zap className="size-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-normal text-white">Microsecond Event Propagation</h4>
                    <p className="text-xs font-normal text-[#979dac] mt-0.5">
                      State mutations on the auctioneer desk instantly reflect across big-screen projections and spectators without delay.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#001233]/70 border border-[#023e7d]/60 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-normal text-white">Full Reversible Audit Trail</h4>
                    <p className="text-xs font-normal text-[#979dac] mt-0.5">
                      Accidental gavel hits or dispute rounds can be stepped back with one-click undo without corrupting team finances.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#001233]/70 border border-[#023e7d]/60 flex items-start gap-3">
                  <BarChart3 className="size-5 text-[#87c2fd] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-normal text-white">Granular Real-Time Analytics</h4>
                    <p className="text-xs font-normal text-[#979dac] mt-0.5">
                      Live purse heatmaps, player grade distribution, and remaining slot costs displayed live to franchise owners.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Platform Checklist */}
          <div className="lg:col-span-6 space-y-5">
            <Badge
              variant="outline"
              className="border-[#023e7d] bg-[#001845] text-[#c3e0fe] text-xs font-normal px-3 py-1"
            >
              Why Tournament Organizers Choose Us
            </Badge>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-normal text-white leading-snug">
              Eliminating friction between bidding enthusiasm and tournament rules.
            </h3>

            <div className="space-y-4 pt-2">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-[#4ba3fb] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-normal text-[#dee0e6]">{item.title}</h4>
                    <p className="text-xs font-normal text-[#7d8597] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button
                className="bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-[15px] sm:text-base px-7 py-3 h-11.5 rounded-xl shadow-[0_0_25px_rgba(249,115,22,0.3)] flex items-center gap-2.5 border border-white/20"
                asChild
              >
                <a href="#features">
                  <span>Explore All Platform Features</span>
                  <ArrowRight className="size-4.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
