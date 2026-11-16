"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import { useSiteSettings } from "../../../lib/SiteSettingsContext";

const Icons = {
  Bell: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
  List: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data, error } = await supabase
          .from("user_notifications")
          .select("id, user_id")
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .eq("is_read", false);

        if (!error && data) {
          const readBroadcasts = JSON.parse(localStorage.getItem("read_broadcast_notifs") || "[]");

          const actualUnread = data.filter(notif => {
            if (notif.user_id === null) {
              return !readBroadcasts.includes(notif.id);
            }
            return true;
          });

          setHasUnread(actualUnread.length > 0);
        }
      }
    };
    checkUserAndNotifications();
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push("/user/login");
  };

  return (
    <>
      <header className="bg-[#184f35] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-[#26352e]">
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="text-xl font-black text-[#F5B041] tracking-widest uppercase leading-tight drop-shadow-md">
              Lotto
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button 
              onClick={() => router.push("/Notification")}
              className="relative p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition border border-white/10"
            >
              <Icons.Bell />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/user/login?redirect=/Lottery" 
                className="border border-white text-white px-3 py-1.5 rounded-full text-[11px] font-bold hover:bg-white/10 transition"
              >
                {t("Login", "লগইন")}
              </Link>
              <Link 
                href="/user/signup?redirect=/Lottery" 
                className="bg-[#F5B041] text-black px-3 py-1.5 rounded-full text-[11px] font-bold hover:opacity-90 transition"
              >
                {t("Signup", "সাইনআপ")}
              </Link>
            </div>
          )}

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-[60px] right-3 mt-1 w-64 bg-[#184f35] border border-[#26352e] rounded-xl shadow-2xl overflow-hidden py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reload Balance (আগে Buy Tickets ছিল) */}
            <button 
              onClick={() => { setIsMenuOpen(false); router.push("/Lottery/Secure-payment"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
            >
              <Icons.Money /> <span className="text-[11px] font-semibold">{t("Reload Balance", "ব্যালেন্স রিলোড")}</span>
            </button>

            {isLoggedIn && (
              <>
                {/* Withdraw Fund */}
                <button 
                  onClick={() => { setIsMenuOpen(false); router.push("/Lottery/withdraw-terms"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
                >
                  <Icons.Document /> <span className="text-[11px] font-semibold">{t("Withdraw Fund", "ফান্ড উত্তোলন")}</span>
                </button>

                {/* Winner */}
                <button 
                  onClick={() => { setIsMenuOpen(false); router.push("/Lottery/winners"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
                >
                  <Icons.Trophy /> <span className="text-[11px] font-semibold">{t("Winner", "বিজয়ী")}</span>
                </button>

                {/* Transactions (নতুন যুক্ত করা হলো) */}
                <button 
                  onClick={() => { setIsMenuOpen(false); router.push("/Lottery/Transactions-activity"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
                >
                  <Icons.List /> <span className="text-[11px] font-semibold">{t("Transactions", "লেনদেন")}</span>
                </button>
              </>
            )}

            {/* Terms Condition */}
            <button 
              onClick={() => { setIsMenuOpen(false); router.push("/Lottery/withdraw-terms"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-black/20 transition border-b border-[#26352e]"
            >
              <Icons.Document /> <span className="text-[11px] font-semibold">{t("Terms Condition", "শর্তাবলী")}</span>
            </button>

            {/* Language Selector */}
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

            {/* Logout */}
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
