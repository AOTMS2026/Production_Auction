"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { TodaysAuctionSection } from "@/components/landing/TodaysAuctionSection";
import { UpcomingAuctionsSection } from "@/components/landing/UpcomingAuctionsSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { getCurrentUser, type UserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gavel,
  Radio,
  Timer,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

// Dynamically import RobotHero to eliminate SSR WebGL mismatches
const RobotHero = dynamic(() => import("@/components/ui/robot-hero"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[88vh] min-h-[640px] bg-gradient-to-b from-[#001233] via-[#001845] to-[#002855] flex items-center justify-center">
      <div className="size-10 rounded-full border-2 border-[#0466c8] border-t-transparent animate-spin" />
    </div>
  ),
});

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    // Check local storage for initial user session
    const savedUser = localStorage.getItem("aotms_user");
    const savedToken = localStorage.getItem("aotms_access_token");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // ignore parse error
      }
    }

    if (savedToken) {
      getCurrentUser(savedToken).then((freshUser) => {
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem("aotms_user", JSON.stringify(freshUser));
        } else {
          localStorage.removeItem("aotms_access_token");
          localStorage.removeItem("aotms_user");
          setCurrentUser(null);
        }
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aotms_access_token");
    localStorage.removeItem("aotms_user");
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#001233] text-white flex flex-col selection:bg-[#f97316] selection:text-white font-sans font-normal text-[15px]">
      {/* 1. Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => {
          setAuthMode("login");
          setAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthMode("register");
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Auth Modal with OTP Verification */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* 2. Hero Section using RobotHero with dynamic cursor movement & Blue-Orange-White theme */}
      <section id="home" className="relative pt-20">
        <RobotHero
          backgroundText="AUCTION"
          pantallaColor="#0466c8"
          pantallaBrillo={1.4}
          color="#f3f4f6"
          scale={1.05}
          metalness={0.15}
        >
          {/* Overlay Content within Hero (Strict pointer-events-none so cursor moves 3D robot freely) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16 sm:pt-20 pb-8 flex flex-col justify-between h-full pointer-events-none">
            {/* Top Interactive Banner & Action Buttons */}
            <div className="max-w-xl pointer-events-auto space-y-4">
              <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-gradient-to-r from-[#0466c8]/40 via-[#f97316]/30 to-white/10 border border-white/20 text-white text-sm font-normal shadow-lg backdrop-blur-md">
                <span className="size-2.5 rounded-full bg-[#f97316] animate-pulse" />
                <span>AOTMS Real-Time Bidding Arena</span>
                <span className="text-white/40">•</span>
                <span className="text-[#c3e0fe]">Sub-80ms Engine</span>
              </div>

              {/* Action Buttons with Blue, Orange, White Gradient */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button
                  className="bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-[15px] sm:text-base px-7 py-3.5 h-12 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.35)] transition-all flex items-center gap-2.5 cursor-pointer border border-white/20"
                  asChild
                >
                  <a href="#todays-auction">
                    <Gavel className="size-5 text-white" />
                    <span>Enter Today's Auction</span>
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="border-white/25 bg-[#001845]/80 hover:bg-[#022950] text-[#c3e0fe] hover:text-white font-normal text-[15px] sm:text-base px-6 py-3.5 h-12 rounded-2xl backdrop-blur-md flex items-center gap-2.5 transition-all cursor-pointer shadow-md"
                  asChild
                >
                  <a href="#upcoming-auctions">
                    <Timer className="size-5 text-[#f97316]" />
                    <span>Upcoming Tournaments</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Bottom Floating Telemetry Ticker with Blue, Orange, White highlights */}
            <div className="pointer-events-auto mt-auto pt-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#001845]/90 border border-[#023e7d]/80 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-gradient-to-br from-[#0466c8]/30 to-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
                    <Radio className="size-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-normal text-[#979dac] uppercase tracking-wider block">
                      Active Arena Lot
                    </span>
                    <span className="text-base sm:text-lg font-normal text-white">
                      M. Srikanth • Lot #17 (Grade A)
                    </span>
                  </div>
                </div>

                <div className="h-8 w-px bg-[#023e7d]/60 hidden sm:block" />

                <div>
                  <span className="text-xs font-normal text-[#979dac] uppercase tracking-wider block">
                    Highest Current Bid
                  </span>
                  <span className="text-base sm:text-lg font-normal text-emerald-400">
                    🪙 85,000 (Sambhav Strikers)
                  </span>
                </div>

                <div className="h-8 w-px bg-[#023e7d]/60 hidden md:block" />

                <div className="hidden md:block">
                  <span className="text-xs font-normal text-[#979dac] uppercase tracking-wider block">
                    Telemetry Latency
                  </span>
                  <span className="text-base font-normal text-[#87c2fd]">
                    64 ms • Zero Drop Rate
                  </span>
                </div>

                <Button
                  className="bg-gradient-to-r from-[#023e7d] to-[#0466c8] hover:from-[#0466c8] hover:to-[#f97316] text-white font-normal text-sm sm:text-[15px] px-5 py-2.5 h-10 rounded-xl transition-all border border-white/20 shadow-sm"
                  asChild
                >
                  <a href="#todays-auction">View Arena</a>
                </Button>
              </div>
            </div>
          </div>
        </RobotHero>
      </section>

      {/* 3. Today's Auction Section */}
      <TodaysAuctionSection />

      {/* 4. Upcoming Auctions Section */}
      <UpcomingAuctionsSection />

      {/* 5. About Section */}
      <AboutSection />

      {/* 6. Features Section */}
      <FeaturesSection />

      {/* 7. Pricing Section */}
      <PricingSection />

      {/* 8. Footer Section */}
      <Footer />
    </div>
  );
}
