"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"tournament" | "annual">("tournament");

  const plans = [
    {
      name: "Club & Academy",
      badge: "Grassroots",
      price: billingCycle === "tournament" ? "₹ 2,499" : "₹ 19,999",
      period: billingCycle === "tournament" ? "per tournament" : "per year",
      description: "Ideal for local cricket clubs, colleges, and regional weekend leagues.",
      features: [
        "Up to 8 Franchise Teams",
        "Up to 150 Registered Players",
        "Standard Auctioneer Console",
        "Public QR Spectator Screen",
        "PDF Roster & Export Summary",
        "Email Support",
      ],
      isPopular: false,
      buttonText: "Start Club Auction",
      buttonVariant: "outline" as const,
    },
    {
      name: "Professional Premier",
      badge: "Most Popular",
      price: billingCycle === "tournament" ? "₹ 6,999" : "₹ 54,999",
      period: billingCycle === "tournament" ? "per tournament" : "per year",
      description: "Designed for district championships, corporate sports cups, and state leagues.",
      features: [
        "Unlimited Teams & Franchises",
        "Unlimited Registered Players",
        "Sub-80ms WebSocket Live Sync",
        "Strict Max-Bid & Purse Guard",
        "4K Stage Big-Screen LED Wall View",
        "Branded PDF Cards with Photos",
        "Live Excel Financial Ledger",
        "Priority 24/7 Phone Support",
      ],
      isPopular: true,
      buttonText: "Deploy Tournament",
      buttonVariant: "default" as const,
    },
    {
      name: "Enterprise & League Syndicate",
      badge: "White-Label",
      price: "Custom",
      period: "dedicated hosting",
      description: "Tailored infrastructure for state federations, televised tournaments, and multi-season leagues.",
      features: [
        "Multiple Concurrent Auctions",
        "Custom Domain & White-label Branding",
        "Dedicated Low-Latency Server Node",
        "Broadcast Graphics (OBS/vMix) Feeds",
        "Role-Based Multi-Admin Accounts",
        "On-Site Technical Supervisor",
        "SLA Guarantee & Custom Contracts",
      ],
      isPopular: false,
      buttonText: "Contact League Sales",
      buttonVariant: "outline" as const,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#001233] text-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#0466c8]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <Badge
            variant="outline"
            className="border-[#0466c8]/50 bg-[#001845] text-[#87c2fd] px-4 py-1.5 text-sm font-normal mb-3"
          >
            Predictable & Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Choose the Ideal Plan for Your Tournament
          </h2>
          <p className="mt-4 text-base sm:text-lg font-normal text-[#979dac]">
            No hidden commissions. No per-bid deductions. Simple tournament passes or annual league subscriptions.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-xl bg-[#001845] border border-[#023e7d]/60">
            <button
              type="button"
              onClick={() => setBillingCycle("tournament")}
              className={`px-5 py-2 rounded-lg text-sm font-normal transition-all ${
                billingCycle === "tournament"
                  ? "bg-gradient-to-r from-[#0466c8] to-[#0f85fa] text-white shadow-sm"
                  : "text-[#979dac] hover:text-white"
              }`}
            >
              Single Tournament
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-lg text-sm font-normal transition-all ${
                billingCycle === "annual"
                  ? "bg-gradient-to-r from-[#0466c8] to-[#0f85fa] text-white shadow-sm"
                  : "text-[#979dac] hover:text-white"
              }`}
            >
              Annual League Pass
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative ${
                plan.isPopular
                  ? "border-2 border-[#0466c8] bg-gradient-to-b from-[#002045] to-[#001845] shadow-[0_0_35px_rgba(4,102,200,0.35)] scale-[1.02]"
                  : "border border-[#023e7d] bg-[#001845]/70 hover:border-[#0466c8]/60"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#0466c8] text-white text-xs font-normal px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="size-3" />
                    <span>Recommended for Tournaments</span>
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-normal text-white">{plan.name}</h3>
                  <span className="text-[11px] font-normal text-[#87c2fd] px-2 py-0.5 rounded-md bg-[#001233] border border-[#023e7d]/60">
                    {plan.badge}
                  </span>
                </div>

                <p className="text-xs font-normal text-[#979dac] min-h-[36px] mb-5">
                  {plan.description}
                </p>

                <div className="mb-6 pt-3 border-t border-[#023e7d]/40">
                  <span className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-normal text-[#7d8597] ml-2">
                    / {plan.period}
                  </span>
                </div>

                <div className="space-y-3.5 mb-8">
                  <span className="text-xs font-normal text-[#87c2fd] uppercase tracking-wider block">
                    What's included:
                  </span>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-sm font-normal text-[#dee0e6]">
                      <Check className="size-4.5 text-[#4ba3fb] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  className={`w-full h-12 rounded-xl text-sm sm:text-base font-normal transition-all ${
                    plan.isPopular
                      ? "bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white shadow-[0_0_25px_rgba(249,115,22,0.35)] border border-white/20"
                      : "border-[#023e7d] bg-[#001233] hover:bg-[#022950] text-[#c3e0fe] hover:text-white"
                  }`}
                  asChild
                >
                  <a href="#auth">
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="size-4 ml-2" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
