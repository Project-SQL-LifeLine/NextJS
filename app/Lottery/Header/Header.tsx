"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import { useSiteSettings } from "../../../lib/SiteSettingsContext";

const Icons = {
  Wallet: () => (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Back: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
};

export default function LotteryHeader({ userProfile }: { userProfile?: any }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { siteName } = useSiteSettings(); 
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <>
      <header className="bg-[#183F35] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-[#26352e]">
        
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button onClick={() => router.push("/")} className="text-white">
            <Icons.Back />
          </button>
          
          <div className="flex flex-col">
            <div className="text-lg font-extrabold text-white tracking-wider leading-tight">
              {siteName} <span className="text-[#F5B041] text-sm">Lottery</span>
            </div>
            <span className="text-[9px] text-[#A0ADB0]">Lucky Draw</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Lottery Balance */}
          <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-[#26352e]">
            <Icons.Wallet />
            <span className="text-white text-[11px] font-bold">
              ৳ {hideBalance ? "****" : (Number(userProfile?.lottery_balance) || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
