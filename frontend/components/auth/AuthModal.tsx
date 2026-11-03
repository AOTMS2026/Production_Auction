"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  X,
  Mail,
  Lock,
  User,
  Image as ImageIcon,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
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
  type UserProfile,
} from "@/lib/api";
import { ImageCropModal } from "@/components/auth/ImageCropModal";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
];

export function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<
    "login" | "register" | "verify" | "forgot-password" | "reset-password"
  >(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(PRESET_AVATARS[0]);
  const [otp, setOtp] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Crop & Adjust state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((mode === "verify" || mode === "reset-password") && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timerSeconds]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!profileImage) {
      setErrorMsg("Profile image is mandatory during registration.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name,
        email,
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
      const res = await verifyEmailOtp(email, otp);
      if (res.user && res.tokens) {
        localStorage.setItem("aotms_access_token", res.tokens.accessToken);
        localStorage.setItem("aotms_user", JSON.stringify(res.user));
        setSuccessMsg("Account verified successfully! Welcome to AOTMS.");
        if (onSuccess) onSuccess(res.user);
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await resendEmailOtp(email);
      setSuccessMsg(res.message);
      setTimerSeconds(300);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.requiresVerification) {
        setErrorMsg("Email not verified yet. Verification code dispatched via n8n.");
        setTimerSeconds(300);
        setMode("verify");
        return;
      }

      if (res.user && res.tokens) {
        localStorage.setItem("aotms_access_token", res.tokens.accessToken);
        localStorage.setItem("aotms_user", JSON.stringify(res.user));
        if (onSuccess) onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

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
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg(res.message || "Password updated! Please sign in.");
      setTimeout(() => {
        setMode("login");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50">
        <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#001845] via-[#001439] to-[#001233] border-2 border-[#023e7d] shadow-[0_0_50px_rgba(4,102,200,0.35)] p-6 sm:p-8 text-white overflow-hidden max-h-[92vh] overflow-y-auto">
          {/* Decorative ambient flare */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#f97316]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#0466c8]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#979dac] hover:text-white hover:bg-[#002855] transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>

          {/* Header */}
          <div className="mb-6 pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0466c8]/20 border border-[#0466c8]/40 text-[#87c2fd] text-xs font-normal mb-3">
              <ShieldCheck className="size-3.5 text-[#f97316]" />
              <span>AOTMS Authentication Protocol</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-white">
              {mode === "login" && "Access Bidding Console"}
              {mode === "register" && "Create Bidder Profile"}
              {mode === "verify" && "Email OTP Verification"}
              {mode === "forgot-password" && "Reset Password"}
              {mode === "reset-password" && "Create New Password"}
            </h2>
            <p className="text-xs sm:text-sm font-normal text-[#979dac] mt-1">
              {mode === "login" && "Sign in with your verified credentials."}
              {mode === "register" && "Verify your email via n8n to enter the arena."}
              {mode === "verify" && "6-digit code dispatched via n8n."}
              {mode === "forgot-password" && "We will send an OTP to your email."}
              {mode === "reset-password" && "Enter the recovery OTP and your new password."}
            </p>
          </div>

          {/* Mode Tabs (Only for login / register) */}
          {(mode === "login" || mode === "register") && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#001233] border border-[#023e7d]/60 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-normal rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-[#0466c8] text-white shadow-md"
                    : "text-[#979dac] hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-normal rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-[#0466c8] text-white shadow-md"
                    : "text-[#979dac] hover:text-white"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <Alert className="mb-4 border-rose-500/50 bg-rose-950/70 text-rose-200 py-2.5">
              <AlertCircle className="size-4 text-rose-400" />
              <AlertDescription className="text-xs font-normal ml-2">
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert className="mb-4 border-emerald-500/50 bg-emerald-950/70 text-emerald-200 py-2.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <AlertDescription className="text-xs font-normal ml-2">
                {successMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* 1. Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type="email"
                    placeholder="franchise@tournament.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-normal text-[#c3e0fe]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-normal text-[#87c2fd] hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white p-1"
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="size-4.5" />
                    ) : (
                      <IoEyeOutline className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11.5 mt-2 bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-sm sm:text-base rounded-xl transition-all shadow-lg border border-white/20"
              >
                {loading ? "Authenticating..." : "Sign In to Console"}
              </Button>
            </form>
          )}

          {/* 2. Registration Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-normal text-[#c3e0fe]">
                    Profile Image <span className="text-[#f97316]">*Mandatory</span>
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-normal text-[#87c2fd] hover:text-white"
                    >
                      <Sliders className="size-3 text-[#f97316]" />
                      <span>Crop & Adjust</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#001233] border border-[#023e7d]/60 mb-2">
                  <div className="relative size-12 rounded-full overflow-hidden border-2 border-[#0466c8] shrink-0 bg-[#002855]">
                    <img
                      src={profileImage}
                      alt="Selected Profile"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileImage(avatarUrl)}
                        className={`relative size-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 shrink-0 ${
                          profileImage === avatarUrl
                            ? "border-[#f97316] ring-2 ring-[#f97316]/50"
                            : "border-[#023e7d]"
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${idx + 1}`} className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  className="h-9.5 text-xs bg-[#001233] border-[#023e7d] text-[#dee0e6] font-normal rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Full Name / Franchise Title
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type="text"
                    placeholder="e.g. Sambhav Strikers Manager"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-10 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Email Address <span className="text-[#f97316]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type="email"
                    placeholder="manager@franchise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Password <span className="text-[#f97316]">* (Min 6 chars)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white p-1"
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="size-4.5" />
                    ) : (
                      <IoEyeOutline className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11.5 mt-2 bg-gradient-to-r from-[#0466c8] via-[#0f85fa] to-[#f97316] hover:opacity-95 text-white font-normal text-sm sm:text-base rounded-xl transition-all shadow-lg border border-white/20"
              >
                {loading ? "Generating OTP..." : "Register & Dispatch Email OTP"}
              </Button>
            </form>
          )}

          {/* 3. OTP Verification Form */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#001233] border border-[#023e7d] text-center space-y-3">
                <span className="text-xs font-normal text-[#979dac] block">
                  Verification code expires in:
                </span>
                <div className="text-2xl font-normal text-[#f97316] font-mono tracking-wider">
                  {formatTimer()}
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-13 text-center tracking-[0.5em] text-2xl font-mono bg-[#001845] border-[#0466c8] text-white rounded-xl"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11.5 bg-gradient-to-r from-[#0466c8] to-[#f97316] text-white font-normal text-sm sm:text-base rounded-xl transition-all"
              >
                {loading ? "Verifying..." : "Confirm & Activate Account"}
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs font-normal text-[#979dac]">
                <button
                  type="button"
                  disabled={loading || timerSeconds > 240}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1 text-[#87c2fd] hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Resend OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-[#979dac] hover:text-white"
                >
                  Edit Information
                </button>
              </div>
            </form>
          )}

          {/* 4. Forgot Password Form */}
          {mode === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type="email"
                    placeholder="manager@franchise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11.5 mt-2 bg-gradient-to-r from-[#0466c8] to-[#f97316] text-white font-normal text-sm sm:text-base rounded-xl transition-all"
              >
                {loading ? "Sending..." : "Dispatch Recovery Code via n8n"}
              </Button>

              <div className="pt-2 text-center text-xs font-normal text-[#979dac]">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#87c2fd] hover:text-white underline underline-offset-2"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 5. Reset Password Form */}
          {mode === "reset-password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#001233] border border-[#023e7d] text-center space-y-2">
                <span className="text-xs font-normal text-[#979dac] block">
                  Code expires in: <span className="text-[#f97316] font-mono">{formatTimer()}</span>
                </span>
                <Input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-11 text-center tracking-[0.5em] text-xl font-mono bg-[#001845] border-[#0466c8] text-white rounded-xl"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white p-1"
                  >
                    {showNewPassword ? (
                      <IoEyeOffOutline className="size-4.5" />
                    ) : (
                      <IoEyeOutline className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-[#c3e0fe] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7d8597]" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 bg-[#001233] border-[#023e7d] text-white text-sm font-normal focus:border-[#0466c8] rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#979dac] hover:text-white p-1"
                  >
                    {showConfirmPassword ? (
                      <IoEyeOffOutline className="size-4.5" />
                    ) : (
                      <IoEyeOutline className="size-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11.5 mt-2 bg-gradient-to-r from-[#0466c8] to-[#f97316] text-white font-normal text-sm sm:text-base rounded-xl transition-all"
              >
                {loading ? "Updating..." : "Update Password & Sign In"}
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs font-normal text-[#979dac]">
                <button
                  type="button"
                  disabled={loading || timerSeconds > 240}
                  onClick={handleForgotPassword}
                  className="inline-flex items-center gap-1 text-[#87c2fd] hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Resend code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#979dac] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Customized Image Crop & Size Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={profileImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(croppedDataUrl) => {
          setProfileImage(croppedDataUrl);
        }}
      />
    </>
  );
}

export default AuthModal;
