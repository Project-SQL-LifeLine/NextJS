"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client";
import { useLanguage } from "../lib/LanguageContext";
import { useSiteSettings } from "../lib/SiteSettingsContext";

// SVG আইকন সেট (সব সাদা রঙের)
const Icons = {
  Deposit: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Withdraw: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  Copy: () => (
    <svg className="w-4 h-4 text-white hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

export default function Header({ isLoggedIn, userProfile }: { isLoggedIn: boolean, userProfile?: any }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  
  const { language, setLanguage, t } = useLanguage();
  const { siteName } = useSiteSettings(); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/user/login");
  };

  const copyGameId = () => {
    if (userProfile?.game_id) {
      navigator.clipboard.writeText(userProfile.game_id);
      alert(t("Game ID Copied!", "গেম আইডি কপি হয়েছে!"));
    }
  };

  return (
    <>
      {/* Header background: bg-[#184f35] */}
      <header className="bg-[#184f35] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-[#26352e]">
        
        {/* ২. সাইট নামের কালার সাদা করা হয়েছে (text-white) */}
        <div className="text-2xl font-extrabold text-white tracking-wider">
          {siteName}
        </div>
        
        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link href="/user/login" className="border border-white text-white px-3 py-1.5 rounded-full text-[11px] font-bold hover:bg-white/10 transition">
                {t("Login", "লগইন")}
              </Link>
              <Link href="/user/signup" className="bg-white text-[#184f35] px-3 py-1.5 rounded-full text-[11px] font-bold hover:opacity-90 transition">
                {t("Register", "রেজিস্টার")}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Profile Info */}
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-[#26352e]">
                {/* ১. game_id সরানো হয়েছে */}
                {/* ৪. (৳) যোগ করা হয়েছে */}
                {/* ৫. ফন্ট সাইজ 11px করা হয়েছে (text-[11px]) */}
                {/* ৬. ব্যালেন্সের কালার সাদা করা হয়েছে (text-white) */}
                <Icons.Wallet />
                <span className="text-white text-[11px] font-bold">
                  ৳ {hideBalance ? "****" : (userProfile?.balance || "0.00")}
                </span>
              </div>
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
          {/* ৩. মেনুর ব্যাকগ্রাউন্ড হেডারের মতো করা হয়েছে (bg-[#184f35]) */}
          <div 
            className="absolute top-[60px] right-3 w-60 bg-[#184f35] border border-[#26352e] rounded-xl shadow-2xl overflow-hidden py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Game ID Copy Section */}
            {isLoggedIn && userProfile && (
              <div className="px-4 py-3 border-b border-[#26352e] flex flex-col gap-1 bg-black/20">
                <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">{t("Game ID", "গেম আইডি")}</span>
                <div className="flex items-center justify-between">
                  <span className="text-white text-[13px] font-bold font-mono">{userProfile.game_id || "N/A"}</span>
                  <button onClick={copyGameId} className="p-1.5 bg-black/30 hover:bg-black/50 rounded-md transition">
                    <Icons.Copy />
                  </button>
                </div>
              </div>
            )}

            {/* Deposit & Withdraw Links */}
            <Link href="/wallets/voucher-center" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition">
              <Icons.Deposit /> <span className="text-[11px]">{t("Deposit", "ডিপোজিট")}</span>
            </Link>
            <Link href="/wallets/withdrawal" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition">
              <Icons.Withdraw /> <span className="text-[11px]">{t("Withdraw", "উত্তোলন")}</span>
            </Link>
            
            <div className="h-px bg-white/10 my-1"></div>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition">
              <Icons.Refresh /> <span className="text-[11px]">{t("Refresh Balance", "ব্যালেন্স রিফ্রেশ")}</span>
            </button>
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition"
            >
              <Icons.EyeOff /> <span className="text-[11px]">{hideBalance ? t("Show Balance", "ব্যালেন্স দেখান") : t("Hide Balance", "ব্যালেন্স লুকান")}</span>
            </button>

            <div className="h-px bg-white/10 my-1"></div>

            {/* Language Selector inside Menu */}
            <div className="px-4 py-2 flex flex-col gap-2">
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

            <div className="h-px bg-white/10 my-1"></div>

            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[#ED4163] hover:bg-black/20 transition">
              <Icons.Logout /> <span className="text-[11px]">{t("Logout", "লগআউট")}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
