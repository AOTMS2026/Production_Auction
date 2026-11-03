"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Camera,
  Activity,
  BellRing,
  KeyRound,
  Zap,
  Crop,
  Sliders,
} from "lucide-react";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import {
  registerUser,
  verifyEmailOtp,
  resendEmailOtp,
  loginUser,
  forgotPassword,
  resetPassword,
} from "@/lib/api";
import { ImageCropModal } from "@/components/auth/ImageCropModal";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get("mode");

  const [mode, setMode] = useState<
    "register" | "login" | "verify" | "forgot-password" | "reset-password"
  >(initialModeParam === "login" ? "login" : "register");

  // Real User Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string>(PRESET_AVATARS[0]);
  const [sendUpdates, setSendUpdates] = useState(true);
  const [otp, setOtp] = useState("");

  // Password Visibility States (Using react-icons)
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Image Crop & Size Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // UI / Async States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialModeParam === "login") {
      setMode("login");
    } else if (initialModeParam === "register") {
      setMode("register");
    }
  }, [initialModeParam]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((mode === "verify" || mode === "reset-password") && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timerSeconds]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
        setErrorMsg(null);
        // Automatically open customized crop & size adjuster modal
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. Register Action
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!profileImage) {
      setErrorMsg("Profile photo is mandatory to set up your account.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("Please provide your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: name.trim() || "Auction Member",
        email: email.trim(),
        password,
        profileImage,
      });

      setSuccessMsg(res.message);
      setTimerSeconds(300);
      setMode("verify");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Registration OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp || otp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp(email.trim(), otp.trim());
      if (res.user && res.tokens) {
        localStorage.setItem("aotms_access_token", res.tokens.accessToken);
        localStorage.setItem("aotms_user", JSON.stringify(res.user));
        setSuccessMsg("Account verified successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend Registration OTP
  const handleResendOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await resendEmailOtp(email.trim());
      setSuccessMsg(res.message);
      setTimerSeconds(300);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Login Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email: email.trim(), password });
      if (res.requiresVerification) {
        setErrorMsg("Email not verified yet. Verification code dispatched via n8n.");
        setTimerSeconds(300);
        setMode("verify");
        return;
      }

      if (res.user && res.tokens) {
        localStorage.setItem("aotms_access_token", res.tokens.accessToken);
        localStorage.setItem("aotms_user", JSON.stringify(res.user));
        setSuccessMsg("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Forgot Password Action
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSuccessMsg(res.message || "Reset code dispatched via n8n.");
      setTimerSeconds(300);
      setMode("reset-password");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Reset Password Action
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp || otp.length !== 6) {
      setErrorMsg("Please enter the 6-digit recovery OTP.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg(res.message || "Password updated successfully! Please sign in.");
      setTimeout(() => {
        setMode("login");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Check your OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getInitials = (str: string) => {
    if (!str.trim()) return "SR";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#001233] text-white flex flex-col justify-between selection:bg-[#f97316] selection:text-white font-sans font-normal">
      {/* Top Header Navigation */}
      <header className="w-full border-b border-[#023e7d]/40 bg-[#001233]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/AOTMS__logo.png"
            alt="AOTMS Logo"
            width={130}
            height={42}
            className="object-contain h-8 sm:h-9 w-auto"
            priority
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-normal text-[#c3e0fe] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#002855]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Arena</span>
        </Link>
      </header>

      {/* Main Split Section: Left Preview & Right Form */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full bg-[#001845]/60 border border-[#023e7d]/60 rounded-3xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,18,51,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          
          {/* ================= LEFT SIDE: DIRECTORY PREVIEW WITH ANIMATED REAL DETAILS ================= */}
          <div className="p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#023e7d]/50 bg-gradient-to-br from-[#001439]/95 via-[#001845]/80 to-[#002050]/85 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Animated Glows */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 size-72 bg-[#0466c8] rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.12, 0.22, 0.12],
              }}
              transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-20 -right-20 size-72 bg-[#f97316] rounded-full blur-3xl pointer-events-none"
            />

            <div>
              {/* Directory Preview Header with Animated Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#87c2fd]" />
                  <span className="text-xs font-normal uppercase tracking-wider text-[#979dac]">
                    Directory Preview
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-[#0466c8]/25 text-[#87c2fd] border border-[#0466c8]/50 shadow-sm"
                >
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="size-2 rounded-full bg-[#f97316]"
                  />
                  <span>Live Preview Mode</span>
                </motion.div>
              </div>

              {/* Animated Directory Preview Card */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[#001233]/90 border border-[#023e7d] rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,18,51,0.8)] backdrop-blur-md transition-all relative overflow-hidden"
              >
                {/* Upper Section: Real-Time Avatar + Real Name + Real Email */}
                <div className="flex items-center gap-4 pb-4 border-b border-[#023e7d]/60">
                  <motion.div
                    key={profileImage}
                    initial={{ scale: 0.8, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative size-16 rounded-full overflow-hidden bg-gradient-to-tr from-[#023e7d] to-[#0466c8] border-2 border-[#f97316]/70 flex items-center justify-center shrink-0 shadow-lg"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={name || "Preview Avatar"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-normal text-white">
                        {getInitials(name)}
                      </span>
                    )}
                  </motion.div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={name || "empty-name"}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="text-base sm:text-lg font-normal text-white truncate flex items-center gap-2"
                      >
                        <span>{name.trim() || "Sam Rivera"}</span>
                        {name.trim() && (
                          <Sparkles className="size-3.5 text-[#f97316] shrink-0" />
                        )}
                      </motion.h3>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={email || "empty-email"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-normal text-[#87c2fd] truncate flex items-center gap-1.5"
                      >
                        <Mail className="size-3 text-[#979dac]" />
                        <span>{email.trim() || "sam@example.com"}</span>
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Lower Section: Real Details (Role, Security, Updates, Channel) */}
                <div className="grid grid-cols-2 gap-3 pt-4 text-xs font-normal">
                  {/* Real Role Cell */}
                  <motion.div
                    layout
                    className="bg-[#001845]/70 border border-[#023e7d]/50 rounded-xl p-3 space-y-1"
                  >
                    <span className="text-[#979dac] text-[11px] block">Account Role</span>
                    <div className="flex items-center gap-1.5 text-white">
                      <ShieldCheck className="size-3.5 text-[#87c2fd]" />
                      <span className="truncate">Member (USER)</span>
                    </div>
                  </motion.div>

                  {/* Real Security Status Cell */}
                  <motion.div
                    layout
                    className="bg-[#001845]/70 border border-[#023e7d]/50 rounded-xl p-3 space-y-1"
                  >
                    <span className="text-[#979dac] text-[11px] block">Security Status</span>
                    <div className="flex items-center gap-1.5 text-white">
                      {mode === "verify" ? (
                        <>
                          <span className="size-2 rounded-full bg-[#f97316] animate-ping" />
                          <span className="text-[#f97316] truncate">Awaiting OTP</span>
                        </>
                      ) : mode === "reset-password" ? (
                        <>
                          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-amber-300 truncate">Reset In Flight</span>
                        </>
                      ) : (
                        <>
                          <Zap className="size-3.5 text-emerald-400" />
                          <span className="text-emerald-300 truncate">n8n Ready</span>
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Real Updates Subscription Cell */}
                  <motion.div
                    layout
                    className="bg-[#001845]/70 border border-[#023e7d]/50 rounded-xl p-3 space-y-1"
                  >
                    <span className="text-[#979dac] text-[11px] block">Updates & Tips</span>
                    <div className="flex items-center gap-1.5">
                      <BellRing
                        className={`size-3.5 ${
                          sendUpdates ? "text-[#f97316]" : "text-[#979dac]"
                        }`}
                      />
                      <span className={sendUpdates ? "text-[#87c2fd]" : "text-[#979dac]"}>
                        {sendUpdates ? "Subscribed" : "Muted"}
                      </span>
                    </div>
                  </motion.div>

                  {/* Real Delivery Engine Cell */}
                  <motion.div
                    layout
                    className="bg-[#001845]/70 border border-[#023e7d]/50 rounded-xl p-3 space-y-1"
                  >
                    <span className="text-[#979dac] text-[11px] block">Delivery Engine</span>
                    <span className="text-white truncate block">
                      Sub-80ms Live
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Helper Subtext */}
              <p className="mt-4 text-xs font-normal text-[#979dac] leading-relaxed">
                This is how teammates and auctioneers will see your real profile across the bidding floor. You can customize size & crop at any time.
              </p>

              {/* Preset Quick-Picker */}
              <div className="mt-7 pt-5 border-t border-[#023e7d]/40">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-normal text-[#979dac]">
                    Or pick a preset avatar:
                  </span>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-normal text-[#87c2fd] hover:text-white transition-colors cursor-pointer"
                    >
                      <Crop className="size-3" />
                      <span>Adjust Crop & Size</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {PRESET_AVATARS.map((av, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setProfileImage(av)}
                      className={`relative size-10 rounded-full overflow-hidden border-2 transition-colors cursor-pointer ${
                        profileImage === av
                          ? "border-[#f97316] ring-2 ring-[#f97316]/60 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                          : "border-[#023e7d] opacity-75 hover:opacity-100"
                      }`}
                      aria-label={`Select avatar ${idx + 1}`}
                    >
                      <img src={av} alt="Preset avatar" className="size-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="mt-8 pt-6 border-t border-[#023e7d]/40 flex items-center gap-3 text-xs font-normal text-[#87c2fd]">
              <ShieldCheck className="size-4 text-[#f97316]" />
              <span>Cryptographic OTP delivered via n8n webhook</span>
            </div>
          </div>

          {/* ================= RIGHT SIDE: AUTH FORMS ================= */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#001439]/50">
            {/* Mode Header */}
            <div className="mb-6">
              {mode === "register" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-normal text-white">
                    Set up your profile
                  </h1>
                  <p className="text-sm font-normal text-[#979dac] mt-1.5">
                    Add the details teammates will see across the workspace.
                  </p>
                </>
              )}
              {mode === "login" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-normal text-white">
                    Welcome back
                  </h1>
                  <p className="text-sm font-normal text-[#979dac] mt-1.5">
                    Sign in to enter the live auction floor and place bids.
                  </p>
                </>
              )}
              {mode === "verify" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-normal text-white">
                    Verify your email
                  </h1>
                  <p className="text-sm font-normal text-[#979dac] mt-1.5">
                    Enter the 6-digit code delivered to{" "}
                    <span className="text-[#87c2fd]">{email}</span>.
                  </p>
                </>
              )}
              {mode === "forgot-password" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-normal text-white">
                    Reset your password
                  </h1>
                  <p className="text-sm font-normal text-[#979dac] mt-1.5">
                    Enter your account email to receive a secure recovery code via n8n.
                  </p>
                </>
              )}
              {mode === "reset-password" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-normal text-white">
                    Choose new password
                  </h1>
                  <p className="text-sm font-normal text-[#979dac] mt-1.5">
                    Enter the 6-digit OTP code sent to{" "}
                    <span className="text-[#87c2fd]">{email}</span> and pick a new password.
                  </p>
                </>
              )}
            </div>

            {/* Alerts */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-sm font-normal flex items-start gap-2.5"
              >
                <AlertCircle className="size-4.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-sm font-normal flex items-start gap-2.5"
              >
                <CheckCircle2 className="size-4.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* 1. REGISTRATION FORM */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Upload Photo Row with Crop & Size Adjuster */}
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-full overflow-hidden bg-[#001845] border border-[#023e7d] flex items-center justify-center shrink-0">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Selected Photo"
                        className="size-full object-cover"
                      />
                    ) : (
                      <UserIcon className="size-7 text-[#979dac]" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001845] hover:bg-[#022950] border border-[#023e7d] text-white text-xs font-normal transition-colors cursor-pointer"
                      >
                        <Camera className="size-3.5 text-[#87c2fd]" />
                        <span>Upload photo</span>
                      </button>

                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => setIsCropModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#022950] hover:bg-[#023e7d] border border-[#0466c8]/60 text-[#c3e0fe] text-xs font-normal transition-colors cursor-pointer"
                          title="Crop and resize your avatar"
                        >
                          <Sliders className="size-3.5 text-[#f97316]" />
                          <span>Crop & Adjust</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-normal text-[#979dac]">
                      PNG or JPG, at least 400 × 400 px, up to 10 MB.
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Full name <span className="text-[#f97316]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sam Rivera"
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Email address <span className="text-[#f97316]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sam@example.com"
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                  />
                </div>

                {/* Password with react-icons Eye Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Password <span className="text-[#f97316]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <IoEyeOffOutline className="size-4.5" />
                      ) : (
                        <IoEyeOutline className="size-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkbox: Product Updates */}
                <label className="flex items-center gap-2.5 pt-1 text-xs font-normal text-[#dee0e6] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendUpdates}
                    onChange={(e) => setSendUpdates(e.target.checked)}
                    className="size-4 rounded border-[#023e7d] text-[#0466c8] focus:ring-0 accent-[#0466c8]"
                  />
                  <span>Send me product updates and workspace tips.</span>
                </label>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white text-sm font-normal shadow-[0_4px_25px_rgba(249,115,22,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Continue</span>
                  )}
                </button>

                {/* Switch to Login */}
                <div className="pt-2 text-center text-xs font-normal text-[#979dac]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#87c2fd] hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 2. LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Email address <span className="text-[#f97316]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sam@example.com"
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-normal text-[#dee0e6]">
                      Password <span className="text-[#f97316]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot-password");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-normal text-[#87c2fd] hover:text-white transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <IoEyeOffOutline className="size-4.5" />
                      ) : (
                        <IoEyeOutline className="size-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] to-[#0f85fa] hover:opacity-95 text-white text-sm font-normal shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="pt-3 text-center text-xs font-normal text-[#979dac]">
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#87c2fd] hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Set up your profile
                  </button>
                </div>
              </form>
            )}

            {/* 3. OTP VERIFICATION FORM (Registration) */}
            {mode === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#001233]/80 border border-[#023e7d] text-center space-y-3">
                  <span className="text-xs font-normal text-[#979dac] block">
                    Security code expires in:
                  </span>
                  <div className="text-xl font-normal text-[#f97316] font-mono tracking-wider">
                    {formatTimer()}
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-[#001845] border border-[#0466c8] rounded-xl text-white outline-none"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] to-[#f97316] hover:opacity-95 text-white text-sm font-normal transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs font-normal text-[#979dac]">
                  <button
                    type="button"
                    disabled={loading || timerSeconds > 240}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 text-[#87c2fd] hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Resend code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-[#979dac] hover:text-white cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}

            {/* 4. FORGOT PASSWORD FORM */}
            {mode === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Registered email address <span className="text-[#f97316]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sam@example.com"
                    className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl px-3.5 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] to-[#f97316] hover:opacity-95 text-white text-sm font-normal shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Recovery Code</span>
                  )}
                </button>

                <div className="pt-2 text-center text-xs font-normal text-[#979dac]">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#87c2fd] hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 5. RESET PASSWORD FORM */}
            {mode === "reset-password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-Digit OTP */}
                <div className="p-3.5 rounded-2xl bg-[#001233]/80 border border-[#023e7d] text-center space-y-2">
                  <span className="text-xs font-normal text-[#979dac] block">
                    Code expires in:{" "}
                    <span className="text-[#f97316] font-mono">{formatTimer()}</span>
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2 bg-[#001845] border border-[#0466c8] rounded-xl text-white outline-none"
                    autoFocus
                  />
                </div>

                {/* New Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    New Password <span className="text-[#f97316]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <IoEyeOffOutline className="size-4.5" />
                      ) : (
                        <IoEyeOutline className="size-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-normal text-[#dee0e6]">
                    Confirm New Password <span className="text-[#f97316]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#001233] border border-[#023e7d] focus:border-[#0466c8] rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-normal text-white placeholder:text-[#979dac]/60 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <IoEyeOffOutline className="size-4.5" />
                      ) : (
                        <IoEyeOutline className="size-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] to-[#f97316] hover:opacity-95 text-white text-sm font-normal shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Update Password & Sign In</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs font-normal text-[#979dac]">
                  <button
                    type="button"
                    disabled={loading || timerSeconds > 240}
                    onClick={handleForgotPassword}
                    className="inline-flex items-center gap-1 text-[#87c2fd] hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Resend reset code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-[#979dac] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Customized Image Crop & Size Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={profileImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(croppedDataUrl) => {
          setProfileImage(croppedDataUrl);
        }}
      />

      {/* Footer */}
      <footer className="w-full border-t border-[#023e7d]/30 py-4 text-center text-xs font-normal text-[#979dac]">
        © 2026 AOTMS Real-Time Auction Arena. All rights reserved.
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#001233] flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-[#0466c8] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
