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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(0, 30, 0, 0);

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
  ];

  const ticketTiers = [50, 100, 250, 500, 1000];

  return (
    <div className="lottery-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="lottery-main">
        
        {/* ১. জ্যাকপট সেকশন */}
        <div className="jackpot-card">
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

        {/* ২. লটারি ব্যানার স্লাইডার */}
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
                  <div className="banner-notice">
                    {banner.notice_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ৩. টিকিট সেকশন */}
        <div>
          <h2 className="section-title">{t("Buy Lottery Tickets", "লটারি টিকিট কিনুন")}</h2>
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

        {/* ৪. লটারি ওয়ালেট */}
        <div className="wallet-card">
          <div className="wallet-info">
            <h4>{t("Lottery Wallet Balance", "লটারি ওয়ালেট ব্যালেন্স")}</h4>
            <div className="amount">৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</div>
          </div>
          {/* লিংক withdraw-terms পেজে পাঠানো হলো */}
          <button className="withdraw-btn" onClick={() => router.push('/Lottery/withdraw-terms')}>
            {t("Withdraw", "উত্তোলন")}
          </button>
        </div>

        {/* ৫. সাম্প্রতিক বিজয়ী */}
        <div>
          <h2 className="section-title">{t("Recent Winners", "সাম্প্রতিক বিজয়ী")}</h2>
          <div className="winners-list">
            {mockWinners.map((winner, idx) => (
              <div key={idx} className="winner-item">
                <span className="winner-id">ID: {winner.id}</span>
                <span className="winner-prize">৳ {winner.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <LotteryFooter />
    </div>
  );
}
