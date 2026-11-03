"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuctionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auctions");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020f14] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#7fa3b0]">Redirecting to Auctions...</span>
      </div>
    </div>
  );
}
