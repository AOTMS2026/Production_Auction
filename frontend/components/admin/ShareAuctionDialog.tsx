"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  ShieldCheck,
  Lock,
  Globe,
} from "lucide-react";
import type { Auction } from "@/lib/api";

interface ShareAuctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null;
}

export function ShareAuctionDialog({
  isOpen,
  onClose,
  auction,
}: ShareAuctionDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !auction) return null;

  // Canonical auction URL
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const shareUrl = `${origin}/auctions/${auction._id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: auction.name,
          text: `Join the ${auction.sport} auction on AOTMS Real-Time Arena: ${auction.name}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Join ${auction.name} (${auction.sport}) on AOTMS Real-Time Auction Arena: ${shareUrl}`
  )}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    `Invitation to ${auction.name}`
  )}&body=${encodeURIComponent(
    `Hello,\n\nYou are invited to participate in the ${auction.name} (${auction.sport} auction) on AOTMS.\n\nOpen link: ${shareUrl}\n\nNote: If this is a private auction, please submit an access request upon opening the link.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-md rounded-3xl bg-[#001439] border border-[#023e7d] shadow-[0_0_50px_rgba(4,102,200,0.35)] p-6 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#023e7d]/60 mb-5">
          <div className="flex items-center gap-2">
            <Share2 className="size-4.5 text-[#f97316]" />
            <h3 className="text-base font-normal text-white">Share Auction</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#979dac] hover:text-white hover:bg-[#002855] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Auction Card Summary */}
        <div className="p-3.5 rounded-2xl bg-[#001233] border border-[#023e7d] flex items-center gap-3.5 mb-5">
          <div className="relative size-12 rounded-xl overflow-hidden bg-[#001845] shrink-0 border border-[#023e7d]">
            <img
              src={auction.image?.url}
              alt={auction.name}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-normal text-white truncate">{auction.name}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-normal text-[#87c2fd]">
              <span>{auction.sport}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {auction.visibility === "PRIVATE" ? (
                  <>
                    <Lock className="size-3 text-[#f97316]" />
                    <span className="text-[#f97316]">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="size-3 text-emerald-400" />
                    <span className="text-emerald-300">Public</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-normal text-[#dee0e6]">
            Canonical Auction Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#001233] border border-[#023e7d] rounded-xl px-3 py-2 text-xs font-mono text-[#87c2fd] outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#0466c8] hover:bg-[#0f85fa] text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Social & Sharing Channels */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#001845] hover:bg-[#002855] border border-[#023e7d] flex flex-col items-center justify-center gap-1.5 text-xs font-normal text-[#dee0e6] transition-colors"
          >
            <MessageCircle className="size-5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          <a
            href={mailtoUrl}
            className="p-3 rounded-xl bg-[#001845] hover:bg-[#002855] border border-[#023e7d] flex flex-col items-center justify-center gap-1.5 text-xs font-normal text-[#dee0e6] transition-colors"
          >
            <Mail className="size-5 text-[#87c2fd]" />
            <span>Email Invite</span>
          </a>

          <button
            type="button"
            onClick={handleNativeShare}
            className="p-3 rounded-xl bg-[#001845] hover:bg-[#002855] border border-[#023e7d] flex flex-col items-center justify-center gap-1.5 text-xs font-normal text-[#dee0e6] transition-colors cursor-pointer"
          >
            <Send className="size-5 text-[#f97316]" />
            <span>Device Share</span>
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="p-3 rounded-xl bg-[#001233]/70 border border-[#023e7d]/60 text-[11px] font-normal text-[#979dac] leading-relaxed flex items-start gap-2">
          <ShieldCheck className="size-4 text-[#87c2fd] shrink-0 mt-0.5" />
          <span>
            {auction.visibility === "PRIVATE"
              ? "Security Guard: Sharing this private link does NOT automatically grant access. Recipients must submit an access request and be approved by the administrator."
              : "This is a public auction. Anyone with this link can view the auction schedule and roster."}
          </span>
        </div>
      </div>
    </div>
  );
}
