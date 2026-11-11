"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useLanguage } from "../../lib/LanguageContext";
import LotteryHeader from "./Header/Header";
import LotteryFooter from "./Footer/Footer";
import "./lottery.css";

export default function LotteryHomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const basePath = process.env.NODE_ENV === "production" ? "/NextJS" : "";
  
  const [profile, setProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }

      const { data: bannerData } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_active", true)
        .eq("serial", 10) 
        .order("created_at", { ascending: false });

      if (bannerData) setBanners(bannerData);
    };
    fetchData();
  }, []);

  // কাউন্টডাউন টাইমার
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(0, 30, 0, 0); // রাত ১২:৩০

      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mockWinners = [
    { id: "RA****99", amount: "৫০,০০০" },
    { id: "MD****11", amount: "১০,০০০" },
    { id: "TA****88", amount: "৫,০০০" },
    { id: "SM****45", amount: "২৫,০০০" },
    { id: "KA****77", amount: "১,০০০" },
  ];

  const ticketTiers = [50, 100, 250, 500, 1000];

  return (
    <div className="lottery-page-wrapper pb-20">
      
      {/* ফিক্সড ব্যাকগ্রাউন্ড ইমেজ (যা স্ক্রল হবে না) */}
      <div 
        className="lottery-fixed-bg"
        style={{ backgroundImage: `url(${basePath}/home-way.png)` }}
      ></div>

      {/* ওভারলে এবং মেইন কন্টেন্ট */}
      <div className="lottery-overlay">
        <LotteryHeader userProfile={profile} />

        <main className="lottery-main">
          
          {/* ১. প্রিমিয়াম জ্যাকপট কার্ড */}
          <div className="jackpot-card">
            <div className="jackpot-glow"></div>
            <div className="jackpot-title">{t("Today's Jackpot", "আজকের জ্যাকপট")}</div>
            <div className="jackpot-amount">৳ ১,৫০,০০০</div>
            
            <div className="timer-container">
              <div className="timer-box">
                <span>{timeLeft.hours}</span>
                <span>{t("Hours", "ঘণ্টা")}</span>
              </div>
              <div className="timer-box">
                <span>{timeLeft.minutes}</span>
                <span>{t("Mins", "মিনিট")}</span>
              </div>
              <div className="timer-box">
                <span>{timeLeft.seconds}</span>
                <span>{t("Secs", "সেকেন্ড")}</span>
              </div>
            </div>
          </div>

          {/* ২. লটারি ব্যানার */}
          {banners.length > 0 && (
            <div className="lottery-banner-slider">
              {banners.map((banner) => (
                <div 
                  key={banner.id} 
                  className="lottery-banner-card"
                  onClick={() => {
                    if (banner.redirect_url) router.push(banner.redirect_url);
                  }}
                >
                  <img src={banner.image_url} alt={banner.title || "Lottery Promo"} />
                  {banner.notice_text && (
                    <div className="banner-notice">{banner.notice_text}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ৩. টিকিট সেকশন */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">{t("Buy Tickets", "টিকিট কিনুন")}</h2>
              <span className="text-[10px] text-[#F5B041] font-bold">{t("Select Tier", "টিয়ার সিলেক্ট করুন")}</span>
            </div>
            
            <div className="ticket-grid">
              {ticketTiers.map((price) => (
                <div 
                  key={price} 
                  className={`ticket-card tier-${price}`} 
                  onClick={() => router.push(`/Lottery/tickets-buy-activity?price=${price}`)}
                >
                  <div className="ticket-price">৳ {price}</div>
                  <div className="ticket-label">{t("Per Ticket", "প্রতি টিকিট")}</div>
                  <button className="buy-btn">{t("Play Now", "কিনুন")}</button>
                </div>
              ))}
            </div>
          </div>

          {/* ৪. লটারি ওয়ালেট (স্মার্ট ডিজাইন) */}
          <div className="wallet-card">
            <div className="wallet-header">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <h4>{t("My Lottery Balance", "আমার লটারি ব্যালেন্স")}</h4>
              </div>
              <span className="amount">৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</span>
            </div>
            <div className="wallet-actions">
              <button className="withdraw-btn" onClick={() => router.push('/Lottery/withdraw-terms')}>
                {t("Withdraw", "উত্তোলন")}
              </button>
              <button className="reload-btn" onClick={() => router.push('/Lottery/Secure-payment')}>
                {t("Reload", "রিলোড")}
              </button>
            </div>
          </div>

          {/* ৫. লাইভ উইনার্স (স্ক্রলিং এফেক্ট) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00E701] animate-ping"></span>
              <h2 className="section-title m-0">{t("Live Winners", "লাইভ বিজয়ী")}</h2>
            </div>
            
            <div className="winners-ticker-wrapper">
              <div className="winners-ticker">
                {[...mockWinners, ...mockWinners].map((winner, idx) => (
                  <div key={idx} className="winner-ticker-item">
                    <span className="winner-id">ID: {winner.id}</span>
                    <span className="winner-prize">৳ {winner.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>

        <LotteryFooter />
      </div>
    </div>
  );
}
