"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client";

// SVG আইকন সেট
const Icons = {
  Deposit: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  ),
  Withdraw: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
  ),
};

export default function Header({ isLoggedIn, userProfile }: { isLoggedIn: boolean, userProfile?: any }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [hideBalance, setHideBalance] = useState(false);

  // পেজ লোডের সময় লোকাল স্টোরেজ থেকে ভাষা চেক করা
  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/user/login");
  };

  // ভাষা অনুযায়ী লেখা পরিবর্তনের অবজেক্ট
  const t = {
    EN: { Deposit: "Deposit", Withdraw: "Withdraw", Refresh: "Refresh Balance", Hide: "Hide Balance", Show: "Show Balance", Logout: "Logout" },
    BN: { Deposit: "ডিপোজিট", Withdraw: "উত্তোলন", Refresh: "ব্যালেন্স রিফ্রেশ", Hide: "ব্যালেন্স লুকান", Show: "ব্যালেন্স দেখান", Logout: "লগআউট" },
  }[language as "EN" | "BN"];

  return (
    <>
      <header className="bg-[#0d2b45] px-3 py-2 flex items-center justify-between sticky top-0 z-50 shadow-md">
        
        {/* Logo */}
        <div className="text-2xl font-extrabold text-yellow-400 tracking-wider">
          Casino
        </div>
        
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <>
              <Link href="/user/login" className="border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-500/10 transition">
                Login
              </Link>
              <Link href="/user/signup" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold hover:opacity-90 transition">
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Profile Info */}
              <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-full border border-[#2F4553]">
                <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-6 h-6 rounded-full border border-white" />
                <div className="flex flex-col text-[10px] leading-tight text-white pr-1">
                  <span className="font-bold">{userProfile?.game_id || "User"}</span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    <span className="bg-yellow-600 w-3 h-3 rounded-sm inline-block"></span> 
                    {hideBalance ? "****" : (userProfile?.balance || "0.00")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Language Button */}
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)} 
              className="text-white text-sm font-bold bg-white/10 px-2 py-1 rounded-md flex items-center gap-1"
            >
              {language === "EN" ? "🇺🇸 EN" : "🇧🇩 BN"}
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-24 bg-[#1A2C38] border border-[#2F4553] rounded-md shadow-lg z-50 flex flex-col">
                <button onClick={() => changeLanguage("BN")} className="text-white text-sm px-3 py-2 hover:bg-[#253B49] text-left">🇧🇩 বাংলা</button>
                <button onClick={() => changeLanguage("EN")} className="text-white text-sm px-3 py-2 hover:bg-[#253B49] text-left">🇺🇸 English</button>
              </div>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {/* Dropdown Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-14 right-3 w-48 bg-[#1A2C38] border border-[#2F4553] rounded-xl shadow-2xl overflow-hidden py-2"
            onClick={(e) => e.stopPropagation()} // মেনুর ভেতরে ক্লিক করলে বন্ধ হবে না
          >
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#253B49] transition">
              <Icons.Deposit /> <span className="text-sm">{t.Deposit}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#253B49] transition">
              <Icons.Withdraw /> <span className="text-sm">{t.Withdraw}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#253B49] transition">
              <Icons.Refresh /> <span className="text-sm">{t.Refresh}</span>
            </button>
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#253B49] transition"
            >
              <Icons.EyeOff /> <span className="text-sm">{hideBalance ? t.Show : t.Hide}</span>
            </button>
            <div className="h-px bg-[#2F4553] my-1"></div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#ED4163]/20 transition">
              <Icons.Logout /> <span className="text-sm">{t.Logout}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
