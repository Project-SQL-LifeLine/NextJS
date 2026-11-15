"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useLanguage } from "../../lib/LanguageContext";
import LotteryHeader from "./Header/Header";
import Footer from "./Footer/Footer"; 
import "./lottery.css";

export default function LotteryHomePage() {
  const router = useRouter();
  const { t } = useLanguage(); 
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [yesterdayDate, setYesterdayDate] = useState(""); // ডাইনামিক তারিখের জন্য স্টেট
  
  const jackpotAmounts = [50000, 100000, 250000, 500000, 1000000];
  const [activeJackpot, setActiveJackpot] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (data) setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
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

  // ==========================================
  // গতকালের তারিখ বের করার লজিক
  // ==========================================
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // আজকের তারিখ থেকে ১ দিন বিয়োগ
    
    // ফরম্যাট: "MON 14 MAR"
    const formattedDate = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).toUpperCase().replace(',', ''); 
    
    setYesterdayDate(formattedDate);
  }, []);

  // ==========================================
  // টাইমার লজিক: প্রতিদিন রাত 12:30 AM (00:30:00) এর জন্য
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      
      // রাত 12:30 AM সেট করা হলো
      target.setHours(0, 30, 0, 0);

      // যদি আজকের 12:30 AM পার হয়ে যায়, তবে আগামীকালকের 12:30 AM টার্গেট করবে
      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

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

  // টিকিট টায়ার ডাটা
  const ticketTiers = [
    { price: 50, title: "LOTTO", titleSpan: "INDIA", color: "orange", numbers: [12, 27, 34, 40, 41, 42, 2], lastNumOrange: true },
    { price: 100, title: "Kerala", titleSpan: "", color: "green", numbers: [8, 15, 22, 31, 44, 49, 7], lastNumOrange: true },
    { price: 250, title: "Sambad", titleSpan: "", color: "orange", numbers: [3, 11, 19, 25, 33, 48, 9], lastNumOrange: true },
    { price: 500, title: "LOTTO", titleSpan: "GOLD", color: "green", numbers: [1, 5, 14, 28, 36, 45, 6], lastNumOrange: true },
    { price: 1000, title: "LOTTO", titleSpan: "MEGA", color: "orange", numbers: [2, 9, 18, 29, 38, 47, 5], lastNumOrange: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1a13] flex flex-col items-center justify-center">
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
          
          {/* 1. Jackpot Slider */}
          <div className="jackpot-slider-wrapper">
            <div className="jackpot-overlay"></div>
            <div className="jackpot-track" style={{ transform: `translateX(-${activeJackpot * 100}%)` }}>
              {jackpotAmounts.map((amount, index) => (
                <div key={index} className="jackpot-slide">
                  <div className="jackpot-title">TODAY'S JACKPOT</div>
                  <div className="jackpot-amount">৳ {amount.toLocaleString()}</div>
                  
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
            <div className="jackpot-dots">
              {jackpotAmounts.map((_, index) => (
                <div key={index} className={`jackpot-dot ${activeJackpot === index ? "active" : ""}`} onClick={() => setActiveJackpot(index)} />
              ))}
            </div>
          </div>

          {/* 1.5 Jackpot কার্ডের ঠিক নিচে ইমেজ */}
          <div className="w-full mt-1 mb-3">
            <img 
              src="https://i.ibb.co.com/Z6W8bbtz/file-000000002204821192cb3561d5e7a1d3.png" 
              alt="Lottery Promo Banner" 
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
          </div>

          {/* 2. Ticket Grid */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">Buy & Win</h2>
              <span className="text-[10px] text-[#F5B041] font-bold">Select Draw</span>
            </div>
            
            <div className="ticket-list-container">
              {ticketTiers.map((tier, index) => (
                <div key={index} className="lotto-card">
                  {/* Header */}
                  <div className="lotto-card-header">
                    <div className={`lotto-card-title ${tier.color}`}>
                      {tier.title} {tier.titleSpan && <span style={{ color: tier.color === 'orange' ? '#16a34a' : '#f97316' }}>{tier.titleSpan}</span>}
                    </div>
                    <div className="lotto-card-date">
                      {/* ডাইনামিক গতকালের তারিখ */}
                      <span>{yesterdayDate || "Loading..."}</span> 
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="lotto-card-numbers">
                    {tier.numbers.slice(0, 6).map((num, i) => (
                      <div key={i} className="num-circle green">{num}</div>
                    ))}
                    {tier.lastNumOrange && (
                      <div className="num-circle orange">{tier.numbers[6]}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lotto-card-actions">
                    {/* নাম্বার সার্কেলের কালারের সাথে মিল রেখে বাটন কালার */}
                    <button 
                      className="lotto-btn" 
                      style={{ backgroundColor: '#184f35', borderColor: '#2e9b4a', color: '#ffffff' }}
                      onClick={() => router.push('/Lottery/winners')}
                    >
                      Draw History
                    </button>
                    <button 
                      className="lotto-btn" 
                      style={{ backgroundColor: '#184f35', borderColor: '#2e9b4a', color: '#ffffff' }}
                      onClick={() => router.push(`/Lottery/tickets-buy-activity?price=${tier.price}`)}
                    >
                      Buy ৳{tier.price}
                    </button>
                  </div>

                  {/* Green Timer Bar */}
                  <div className="lotto-timer-bar">
                    <div className="lotto-timer-label">
                      Next<br/>Draw
                    </div>
                    <div className="lotto-timer-boxes">
                      <div className="lotto-t-box">
                        <span className="t-val">{timeLeft.days}</span>
                        <span className="t-lbl">Days</span>
                      </div>
                      <div className="lotto-t-box">
                        <span className="t-val">{timeLeft.hours}</span>
                        <span className="t-lbl">Hours</span>
                      </div>
                      <div className="lotto-t-box">
                        <span className="t-val">{timeLeft.minutes}</span>
                        <span className="t-lbl">Mins</span>
                      </div>
                      <div className="lotto-t-box">
                        <span className="t-val">{timeLeft.seconds}</span>
                        <span className="t-lbl">Secs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </div>
  );
}
