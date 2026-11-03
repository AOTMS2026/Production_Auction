"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Radio, ArrowUpRight, LogOut, User as UserIcon } from "lucide-react";
import type { UserProfile } from "@/lib/api";

interface NavbarProps {
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onLogout?: () => void;
}

export function Navbar({
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onLogout,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "Auctions", href: "/auctions" },
    { label: "Today's Auction", href: "/#todays-auction", isLive: true },
    { label: "Upcoming", href: "/#upcoming-auctions" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#001233]/90 backdrop-blur-md border-b border-[#023e7d]/60 shadow-[0_4px_30px_rgba(0,18,51,0.6)] py-3"
          : "bg-[#001233]/60 backdrop-blur-sm border-b border-[#023e7d]/30 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-28 sm:h-11 sm:w-32 flex items-center justify-start overflow-hidden">
              <Image
                src="/AOTMS__logo.png"
                alt="AOTMS Logo"
                width={140}
                height={45}
                className="object-contain w-auto h-9 sm:h-10 transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative px-3.5 py-2 text-[15px] font-normal text-[#dee0e6] hover:text-[#c3e0fe] transition-colors rounded-lg hover:bg-[#022950]/50 flex items-center gap-1.5"
              >
                <span>{link.label}</span>
                {link.isLive && (
                  <Badge
                    variant="outline"
                    className="border-[#f97316]/60 bg-[#f97316]/15 text-[#fb923c] px-1.5 py-0 text-[11px] font-normal flex items-center gap-1"
                  >
                    <span className="size-1.5 rounded-full bg-[#f97316] animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </a>
            ))}
          </nav>

          {/* Right Action: User Status or Login / Sign-up */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-[#001845]/80 border border-[#023e7d] rounded-xl px-3 py-1.5 backdrop-blur-md">
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                  className="size-8 rounded-full object-cover border border-[#f97316]/60"
                />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-normal text-white max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] font-normal text-[#87c2fd]">
                    {currentUser.role}
                  </span>
                </div>
                {currentUser.role === "ADMIN" && (
                  <Link
                    href="/auctions"
                    className="ml-1 px-2 py-0.5 rounded-lg bg-[#0466c8]/60 hover:bg-[#0466c8] text-white text-[11px] font-normal border border-[#f97316]/50 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-[#979dac] hover:text-rose-400 hover:bg-[#022950] p-1.5 h-8 w-8 rounded-lg ml-0.5"
                  title="Log out"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[#023e7d] bg-[#001845]/60 hover:bg-[#022950] text-[#c3e0fe] hover:text-white font-normal text-sm px-4 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <Link href="/auth?mode=login">Login</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-sm px-4.5 py-1.5 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center gap-1 border border-white/20 cursor-pointer"
                >
                  <Link href="/auth?mode=register">
                    <span>Sign Up</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {!currentUser && (
              <Button
                size="sm"
                asChild
                className="bg-[#0466c8] text-white font-normal text-xs px-2.5 py-1 sm:hidden cursor-pointer"
              >
                <Link href="/auth?mode=register">Sign Up</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#dee0e6] hover:text-white hover:bg-[#002855] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#023e7d]/50 bg-[#001233]/95 rounded-2xl p-4 shadow-2xl animate-in fade-in-50 slide-in-from-top-2">
            <div className="flex flex-col gap-1.5">
              {currentUser && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#001845] border border-[#023e7d] mb-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="size-8 rounded-full object-cover border border-[#f97316]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-normal text-white">{currentUser.name}</span>
                      <span className="text-xs font-normal text-[#87c2fd]">{currentUser.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onLogout?.();
                      setMobileMenuOpen(false);
                    }}
                    className="text-rose-400 hover:text-rose-300 font-normal text-xs"
                  >
                    Logout
                  </Button>
                </div>
              )}

              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-normal text-[#dee0e6] hover:text-white hover:bg-[#022950] transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.isLive && (
                    <Badge
                      variant="outline"
                      className="border-rose-500/60 bg-rose-950/50 text-rose-300 px-1.5 py-0 text-[10px] font-normal flex items-center gap-1"
                    >
                      <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                </a>
              ))}
              {!currentUser && (
                <div className="pt-3 mt-2 border-t border-[#023e7d]/40 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#023e7d] bg-[#001845] text-[#c3e0fe] font-normal text-sm cursor-pointer"
                    asChild
                  >
                    <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button
                    className="flex-1 bg-[#0466c8] text-white font-normal text-sm cursor-pointer"
                    asChild
                  >
                    <Link href="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
