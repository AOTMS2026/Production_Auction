"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gavel,
  ShieldAlert,
  QrCode,
  FileSpreadsheet,
  Layers,
  Tv2,
  Undo2,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Gavel,
      tag: "Live Auctioneer",
      title: "Tactile Auctioneer Cockpit",
      description:
        "High-velocity keyboard and touch controls for quick bid raises, hammer strikes, lot skips, and instant undo with zero lag.",
      accent: "from-[#0466c8]/20 to-[#002855]/40",
      iconColor: "text-[#4ba3fb]",
    },
    {
      icon: ShieldAlert,
      tag: "Rule Governance",
      title: "Automated Max Bid & Slot Guard",
      description:
        "Strict real-time mathematical validation guarantees every franchise preserves minimum points for remaining roster slots.",
      accent: "from-emerald-500/10 to-[#002855]/40",
      iconColor: "text-emerald-400",
    },
    {
      icon: QrCode,
      tag: "Spectator Portal",
      title: "Zero-Barrier QR Check-in",
      description:
        "Fans, players, and spectators simply scan venue QR codes to monitor live bids without needing to register or enter passwords.",
      accent: "from-purple-500/10 to-[#002855]/40",
      iconColor: "text-purple-400",
    },
    {
      icon: FileSpreadsheet,
      tag: "Reporting",
      title: "Audit-Ready PDF & Excel Reports",
      description:
        "Instant one-click exports generating full roster balance sheets, player photographs, price logs, and tournament accounts.",
      accent: "from-amber-500/10 to-[#002855]/40",
      iconColor: "text-amber-400",
    },
    {
      icon: Layers,
      tag: "Multi-Sport",
      title: "Dynamic Sport Rule Configurations",
      description:
        "Built-in presets for Cricket (Batters, Bowlers, Wickets, All-Rounders), Football, Badminton, Esports, and custom leagues.",
      accent: "from-[#023e7d]/30 to-[#002855]/40",
      iconColor: "text-[#87c2fd]",
    },
    {
      icon: Tv2,
      tag: "Broadcasting",
      title: "Stage Projector & Big-Screen Mode",
      description:
        "Optimized 4K high-contrast visual display designed for arena stage LED walls, live television, and streaming broadcast feeds.",
      accent: "from-rose-500/10 to-[#002855]/40",
      iconColor: "text-rose-400",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#001845] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge
            variant="outline"
            className="border-[#0466c8]/50 bg-[#001233] text-[#87c2fd] px-4 py-1.5 text-sm font-normal mb-3"
          >
            Capabilities Engineered for Scale
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Everything Required to Conduct Flawless Auctions
          </h2>
          <p className="mt-4 text-base sm:text-lg font-normal text-[#979dac]">
            From local club tournaments to televised premier leagues, our platform provides comprehensive control and mathematical precision.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border-[#023e7d] bg-[#002045]/60 hover:bg-[#002855] backdrop-blur-md rounded-2xl p-6.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#0466c8]/60 shadow-[0_10px_35px_rgba(0,18,51,0.4)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-12 rounded-xl bg-[#001233] border border-[#023e7d]/60 flex items-center justify-center shadow-inner">
                      <Icon className={`size-5.5 ${item.iconColor}`} />
                    </div>
                    <span className="text-xs font-normal text-[#7d8597] px-2.5 py-0.5 rounded-full bg-[#001233]/70 border border-[#023e7d]/40">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-normal text-white mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-[15px] font-normal text-[#979dac] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#023e7d]/40 flex items-center justify-between text-xs font-normal text-[#87c2fd]">
                  <span>Operational Standard</span>
                  <ArrowRight className="size-3.5 opacity-60" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
