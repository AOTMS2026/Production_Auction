"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Mail,
  ShieldCheck,
  ArrowUpRight,
  Send,
  Heart,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#000a1d] text-[#dee0e6] border-t border-[#023e7d]/60 relative overflow-hidden">
      {/* Decorative top accent line with smart_blue gradient */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#0466c8] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#023e7d]/40">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="#home" className="inline-block">
              <div className="relative h-10 w-32 flex items-center">
                <Image
                  src="/AOTMS__logo.png"
                  alt="AOTMS Logo"
                  width={140}
                  height={45}
                  className="object-contain w-auto h-9"
                />
              </div>
            </Link>

            <p className="text-xs sm:text-sm font-normal text-[#979dac] leading-relaxed max-w-sm">
              The premier real-time auction management infrastructure for sporting leagues, collegiate tournaments, and athletic franchises.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#001233] border border-[#023e7d] text-xs font-normal text-[#87c2fd]">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Auction Nodes Operational • Sub-80ms</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-normal text-[#c3e0fe] uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-normal text-[#979dac]">
              <li>
                <a href="#home" className="hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#todays-auction" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Today's Auction</span>
                  <span className="size-1.5 rounded-full bg-rose-400" />
                </a>
              </li>
              <li>
                <a href="#upcoming-auctions" className="hover:text-white transition-colors">Upcoming Auctions</a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About Platform</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              </li>
            </ul>
          </div>

          {/* Tournament Governance & Security */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-normal text-[#c3e0fe] uppercase tracking-wider">
              Governance
            </h4>
            <ul className="space-y-2 text-xs font-normal text-[#979dac]">
              <li>
                <a href="#spectator" className="hover:text-white transition-colors">QR Spectator Check-in</a>
              </li>
              <li>
                <a href="#rules" className="hover:text-white transition-colors">Purse Rule Calculator</a>
              </li>
              <li>
                <a href="#export" className="hover:text-white transition-colors">Audit & PDF Export</a>
              </li>
              <li>
                <a href="#support" className="hover:text-white transition-colors">Tournament Support</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Direct Inquiries */}
          <div className="lg:col-span-4 space-y-3.5">
            <h4 className="text-sm font-normal text-[#c3e0fe] uppercase tracking-wider">
              Host Your Next Tournament
            </h4>
            <p className="text-sm font-normal text-[#979dac]">
              Subscribe for tournament schedule alerts or request a personalized live auction demonstration.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you! Our tournament coordinator will get in touch shortly.");
              }}
              className="flex items-center gap-2 mt-2"
            >
              <Input
                type="email"
                placeholder="coordinator@league.org"
                className="bg-[#001233] border-[#023e7d] text-white placeholder:text-[#5c677d] text-sm h-10 font-normal focus:border-[#0466c8]"
                required
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#0466c8] to-[#f97316] hover:opacity-95 text-white h-10 px-4 text-sm font-normal rounded-xl shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </form>
            <span className="text-xs font-normal text-[#7d8597] block">
              Direct technical concierge available 24/7 for active live bidding sessions.
            </span>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-[#7d8597]">
          <div>
            © 2026 AOTMS Auction Technology. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#979dac] cursor-pointer">Security Audited</span>
            <span>•</span>
            <span className="hover:text-[#979dac] cursor-pointer">PCI-DSS Compliant Infrastructure</span>
            <span>•</span>
            <span className="hover:text-[#979dac] cursor-pointer">WebSocket TLS 1.3</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
