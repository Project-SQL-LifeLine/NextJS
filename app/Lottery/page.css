"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";
import { useLanguage } from "../../lib/LanguageContext";
import LotteryHeader from "./Header/Header";
import LotteryFooter from "./Footer/Footer";
import "./lottery.css";

export default function LotteryHomePage() {
  const { t } = useLanguage();
  const [lotteryBalance, setLotteryBalance] = useState<number>(0);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  
  // কাউন্টডাউন টাইমার স্টেট
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  // ইউজারের লটারি ব্যালেন্স লোড করা
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("lottery_balance").eq("id", user.id).single();
        if (data) setLotteryBalance(data.lottery_balance || 0);
      }
    };
    fetchBalance();
  }, []);

  // কাউন্টডাউন টাইমার লজিক (প্রতিদিন রাত ১২:৩০ মিনিট)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(0, 30, 0, 0); // রাত ১২:৩০

      // যদি আজকের ১২:৩০ পার হয়ে যায়, তবে আগামীকালের ১২:৩০ সেট করবে
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

  // ডেমো উইনার ডাটা (পরে ডাটাবেস থেকে আসবে)
  const mockWinners = [
    { id: "RA****99", amount: "৫০,০০০" },
    { id: "MD****11", amount: "১০,০০০" },
    { id: "TA****88", amount: "৫,০০০" },
  ];

  const ticketTiers = [50, 100, 250, 500, 1000];

  return (
    <div className="lottery-page">
      <LotteryHeader />

      <main className="lottery-main">
        
        {/* ১. জ্যাকপট সেকশন */}
        <div className="jackpot-card">
          <div className="jackpot-title">{t("Today's Jackpot", "আজকের জ্যাকপট")}</div>
          <div className="jackpot-amount">
            ৳ ১,৫০,০০০
          </div>
          
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

        {/* ২. ৫টি টিকিট */}
        <div>
          <h2 className="section-title">
            {t("Buy Lottery Tickets", "লটারি টিকিট কিনুন")}
          </h2>
          <div className="ticket-grid">
            {ticketTiers.map((price) => (
              <div 
                key={price} 
                className={`ticket-card tier-${price}`}
                onClick={() => setSelectedTicket(price)}
              >
                <div className="ticket-price">৳ {price}</div>
                <div className="ticket-label">{t("Per Ticket", "প্রতি টিকিট")}</div>
                <button className="buy-btn">{t("Play Now", "কিনুন")}</button>
              </div>
            ))}
          </div>
        </div>

        {/* ৩. লটারি ওয়ালেট */}
        <div className="wallet-card">
          <div className="wallet-info">
            <h4>{t("Lottery Wallet Balance", "লটারি ওয়ালেট ব্যালেন্স")}</h4>
            <div className="amount">৳ {lotteryBalance.toFixed(2)}</div>
          </div>
          <button className="withdraw-btn" onClick={() => window.location.href = '/Lottery/withdraw'}>
            {t("Withdraw", "উত্তোলন")}
          </button>
        </div>

        {/* ৪. সাম্প্রতিক বিজয়ী */}
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

      {/* টিকেট কেনার পপ-আপ (মডাল) */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("Select Payment Method", "পেমেন্ট মেথড সিলেক্ট করুন")}</h3>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}>&times;</button>
            </div>
            
            <p className="text-[11px] text-[#A0ADB0] mb-4 text-center">
              {t(`Pay ৳${selectedTicket} to buy a ticket`, `টিকিট কিনতে ৳${selectedTicket} পেমেন্ট করুন`)}
            </p>

            <div className="payment-method-list">
              {/* এখানে আপনার control_payment_method টেবিল থেকে ডাটা ম্যাপ হবে */}
              <button className="payment-btn">
                <img src="https://i.ibb.co/ynRH1K3z/file-00000000.png" alt="Bkash" className="w-8 h-8 object-contain" />
                {t("Bkash (Manual)", "বিকাশ (ম্যানুয়াল)")}
              </button>
              <button className="payment-btn">
                <img src="https://i.ibb.co/VcHQQJFT/file-00000000.png" alt="Nagad" className="w-8 h-8 object-contain" />
                {t("Nagad (Manual)", "নগদ (ম্যানুয়াল)")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
