"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import LotteryHeader from "./Header/Header";
import LotteryFooter from "./Footer/Footer"; 
import "./lottery.css";

export default function LotteryHomePage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [currentDate, setCurrentDate] = useState(""); 
  
  // ব্যানারে নতুন প্রাইজ পুল আপডেট করা হলো
  const jackpotAmounts = [20000, 50000, 100000, 200000];
  const [activeJackpot, setActiveJackpot] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) setProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveJackpot((prev) => (prev + 1) % jackpotAmounts.length);
    }, 3000);
    return () => clearInterval(sliderInterval);
  }, [jackpotAmounts.length]);

  // আজকের বর্তমান তারিখ বের করার লজিক
  useEffect(() => {
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).toUpperCase().replace(',', ''); 
    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(0, 30, 0, 0);
      if (now.getTime() > target.getTime()) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: d.toString().padStart(2, "0"),
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // আপডেট করা টিকিট টায়ার (1000 বাদ দেওয়া হয়েছে এবং নতুন দাম বসানো হয়েছে)
  const ticketTiers = [
    { price: 20, title: "LOTTO", titleSpan: "BD", color: "orange" },
    { price: 50, title: "MEGA", titleSpan: "BD I", color: "green" },
    { price: 100, title: "DHAKA", titleSpan: "MEGA II", color: "orange" },
    { price: 200, title: "DHAKA", titleSpan: "MEGA I", color: "green" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="lottery-page-wrapper pb-20">
      
      <div className="lottery-overlay">
        <LotteryHeader userProfile={profile} />

        <main className="lottery-main">
          
          {/* ১. Today's Jackpot Slider */}
          <div 
            className="jackpot-slider-wrapper"
            style={{ backgroundImage: `url(https://i.ibb.co.com/Z6W8bbtz/file-000000002204821192cb3561d5e7a1d3.png)` }}
          >
            <div className="jackpot-overlay"></div>
            <div className="jackpot-track" style={{ transform: `translateX(-${activeJackpot * 100}%)` }}>
              {jackpotAmounts.map((amount, index) => (
                <div key={index} className="jackpot-slide">
                  <div className="jackpot-title">TODAY'S JACKPOT</div>
                  <div className="jackpot-amount">৳ {amount.toLocaleString()}</div>
                  
                  <div className="timer-container">
                    <div className="timer-box"><span>{timeLeft.hours}</span><span>HOURS</span></div>
                    <div className="timer-box"><span>{timeLeft.minutes}</span><span>MINS</span></div>
                    <div className="timer-box"><span>{timeLeft.seconds}</span><span>SECS</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="jackpot-dots">
              {jackpotAmounts.map((_, index) => (
                <div key={index} className={`jackpot-dot ${activeJackpot === index ? "active" : ""}`} onClick={() => setActiveJackpot(index)} />
              ))}
            </div>
          </div>

          {/* ২. Ticket List */}
          <div className="mt-4">
            <div className="ticket-list-container">
              {ticketTiers.map((tier, index) => (
                <div key={index} className="lotto-card">
                  
                  {/* Header */}
                  <div className="lotto-card-header">
                    <div className={`lotto-card-title ${tier.color}`}>
                      {tier.title} <span style={{ color: tier.color === 'orange' ? '#16a34a' : '#f97316' }}>{tier.titleSpan}</span>
                    </div>
                    <div className="lotto-card-date">
                      {/* আজকের বর্তমান তারিখ */}
                      <span>{currentDate}</span> 
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lotto-card-actions">
                    <button 
                      className="lotto-btn secondary" 
                      onClick={() => router.push('/Lottery/winners')}
                    >
                      Draw History
                    </button>
                    <button 
                      className="lotto-btn primary" 
                      onClick={() => router.push(`/Lottery/tickets-buy-activity?price=${tier.price}`)}
                    >
                      Buy ৳{tier.price}
                    </button>
                  </div>

                  {/* Timer Bar */}
                  <div className="lotto-timer-bar">
                    <div className="lotto-timer-label">Next<br/>Draw</div>
                    <div className="lotto-timer-boxes">
                      <div className="lotto-t-box"><span className="t-val">{timeLeft.days}</span><span className="t-lbl">Days</span></div>
                      <div className="lotto-t-box"><span className="t-val">{timeLeft.hours}</span><span className="t-lbl">Hours</span></div>
                      <div className="lotto-t-box"><span className="t-val">{timeLeft.minutes}</span><span className="t-lbl">Mins</span></div>
                      <div className="lotto-t-box"><span className="t-val">{timeLeft.seconds}</span><span className="t-lbl">Secs</span></div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </main>

        <LotteryFooter />
      </div>
    </div>
  );
}
