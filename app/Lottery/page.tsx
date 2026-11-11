"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useLanguage } from "../../lib/LanguageContext";
import LotteryHeader from "./Header/Header";
import BottomNav from "../../components/BottomNav";
import "./lottery.css";

export default function LotteryHomePage() {
  const router = useRouter();
  const { t } = useLanguage(); // Keeping English based on previous request
  const basePath = process.env.NODE_ENV === "production" ? "/NextJS" : "";
  
  const [profile, setProfile] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });
  
  // Jackpot Slider State
  const jackpotAmounts = [50000, 100000, 250000, 500000, 1000000];
  const [activeJackpot, setActiveJackpot] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchData();
  }, []);

  // Jackpot Slider Auto-Slide Logic
  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveJackpot((prev) => (prev + 1) % jackpotAmounts.length);
    }, 3000); // Changes every 3 seconds
    return () => clearInterval(sliderInterval);
  }, [jackpotAmounts.length]);

  // Countdown Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(0, 30, 0, 0); // 12:30 AM

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
    { id: "RA****99", amount: "50,000" },
    { id: "MD****11", amount: "10,000" },
    { id: "TA****88", amount: "5,000" },
    { id: "SM****45", amount: "25,000" },
    { id: "KA****77", amount: "1,000" },
  ];

  const ticketTiers = [50, 100, 250, 500, 1000];

  return (
    <div className="lottery-page-wrapper pb-20">
      
      {/* Fixed Background Image */}
      <div 
        className="lottery-fixed-bg"
        style={{ backgroundImage: `url(${basePath}/home-way.png)` }}
      ></div>

      {/* Content Overlay */}
      <div className="lottery-overlay">
        <LotteryHeader userProfile={profile} />

        <main className="lottery-main">
          
          {/* 1. Jackpot Slider (Edge-to-Edge with Image Background) */}
          <div 
            className="jackpot-slider-wrapper"
            style={{ backgroundImage: `url(${basePath}/banners-card.png)` }}
          >
            <div className="jackpot-overlay"></div> {/* Overlay for text readability */}
            
            <div 
              className="jackpot-track"
              style={{ transform: `translateX(-${activeJackpot * 100}%)` }}
            >
              {jackpotAmounts.map((amount, index) => (
                <div key={index} className="jackpot-slide">
                  <div className="jackpot-title">TODAY'S JACKPOT</div>
                  <div className="jackpot-amount">
                    ৳ {amount.toLocaleString()}
                  </div>
                  
                  <div className="timer-container">
                    <div className="timer-box">
                      <span>{timeLeft.hours}</span>
                      <span>HOURS</span>
                    </div>
                    <div className="timer-box">
                      <span>{timeLeft.minutes}</span>
                      <span>MINS</span>
                    </div>
                    <div className="timer-box">
                      <span>{timeLeft.seconds}</span>
                      <span>SECS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Slider Dots */}
            <div className="jackpot-dots">
              {jackpotAmounts.map((_, index) => (
                <div 
                  key={index} 
                  className={`jackpot-dot ${activeJackpot === index ? "active" : ""}`}
                  onClick={() => setActiveJackpot(index)}
                />
              ))}
            </div>
          </div>

          {/* 2. Ticket Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">Buy Tickets</h2>
              <span className="text-[10px] text-[#F5B041] font-bold">Select Tier</span>
            </div>
            
            <div className="ticket-grid">
              {ticketTiers.map((price) => (
                <div 
                  key={price} 
                  className={`ticket-card tier-${price}`} 
                  onClick={() => router.push(`/Lottery/tickets-buy-activity?price=${price}`)}
                >
                  <div className="ticket-price">৳ {price}</div>
                  <div className="ticket-label">Per Ticket</div>
                  <button className="buy-btn">Play Now</button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Smart Wallet Section */}
          <div className="wallet-card">
            <div className="wallet-header">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <h4>My Lottery Balance</h4>
              </div>
              <span className="amount">৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</span>
            </div>
            <div className="wallet-actions">
              <button className="withdraw-btn" onClick={() => router.push('/Lottery/withdraw-terms')}>
                Withdraw
              </button>
              <button className="reload-btn" onClick={() => router.push('/Lottery/Secure-payment')}>
                Reload
              </button>
            </div>
          </div>

          {/* 4. Live Winners Ticker */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00E701] animate-ping"></span>
              <h2 className="section-title m-0">Live Winners</h2>
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

        <BottomNav />
      </div>
    </div>
  );
}
