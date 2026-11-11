"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  EyeOff: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Back: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Ticket: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
    </svg>
  ),
  Money: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

export default function LotteryHeader({ userProfile }: { userProfile?: any }) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { siteName } = useSiteSettings(); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push("/user/login");
  };

  // Buy Tickets এ ক্লিক করার ফাংশন
  const handleBuyTicketsClick = () => {
    setIsMenuOpen(false);
    if (!isLoggedIn) {
      router.push("/user/login"); // লগইন না থাকলে লগইন পেজে যাবে
    } else {
      router.push("/Lottery"); // লগইন থাকলে টিকিট পেজে যাবে
    }
  };

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
          {/* Lottery Balance (শুধুমাত্র লগইন থাকলে দেখাবে) */}
          {isLoggedIn && (
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-[#26352e]">
              <Icons.Wallet />
              <span className="text-white text-[11px] font-bold">
                ৳ {hideBalance ? "****" : (Number(userProfile?.lottery_balance) || 0).toFixed(2)}
              </span>
            </div>
          )}

          {/* Hamburger Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Dropdown Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-[60px] right-3 w-64 bg-[#184f35] border border-[#26352e] rounded-xl shadow-2xl overflow-hidden py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ১. Buy Tickets */}
            <button 
              onClick={handleBuyTicketsClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
            >
              <Icons.Ticket /> <span className="text-[11px] font-semibold">{t("Buy Tickets", "টিকিট কিনুন")}</span>
            </button>

            {/* লগইন থাকলে বাকি অপশনগুলো দেখাবে */}
            {isLoggedIn && (
              <>
                {/* ২. Withdraw Fund */}
                <button 
                  onClick={() => { setIsMenuOpen(false); router.push("/Lottery/withdraw-terms"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
                >
                  <Icons.Money /> <span className="text-[11px] font-semibold">{t("Withdraw Fund", "ফান্ড উত্তোলন")}</span>
                </button>

                {/* ৩. Winner */}
                <button 
                  onClick={() => { setIsMenuOpen(false); router.push("/Lottery/winners"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
                >
                  <Icons.Trophy /> <span className="text-[11px] font-semibold">{t("Winner", "বিজয়ী")}</span>
                </button>
              </>
            )}

            {/* ৪. Terms Condition (সবসময় দেখাবে) */}
            <button 
              onClick={() => { setIsMenuOpen(false); router.push("/Lottery/withdraw-terms"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
            >
              <Icons.Document /> <span className="text-[11px] font-semibold">{t("Terms Condition", "শর্তাবলী")}</span>
            </button>

            {/* Hide/Show Balance (শুধুমাত্র লগইন থাকলে) */}
            {isLoggedIn && (
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
              >
                <Icons.EyeOff /> <span className="text-[11px] font-semibold">{hideBalance ? t("Show Balance", "ব্যালেন্স দেখান") : t("Hide Balance", "ব্যালেন্স লুকান")}</span>
              </button>
            )}

            {/* Language Selector (সবসময় দেখাবে) */}
            <div className="px-4 py-2 flex flex-col gap-2 border-b border-[#26352e]">
              <span className="text-[11px] text-white/70 font-semibold flex items-center gap-2">
                <Icons.Globe /> {t("Language", "ভাষা")}
              </span>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setLanguage("BN")} 
                  className={`flex-1 text-[11px] py-1.5 rounded border ${language === "BN" ? "border-white text-white" : "border-white/20 text-white/70 hover:text-white"}`}
                >
                  🇧🇩 বাংলা
                </button>
                <button 
                  onClick={() => setLanguage("EN")} 
                  className={`flex-1 text-[11px] py-1.5 rounded border ${language === "EN" ? "border-white text-white" : "border-white/20 text-white/70 hover:text-white"}`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Logout (শুধুমাত্র লগইন থাকলে) */}
            {isLoggedIn && (
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[#ED4163] hover:bg-black/20 transition">
                <Icons.Logout /> <span className="text-[11px] font-semibold">{t("Logout", "লগআউট")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
