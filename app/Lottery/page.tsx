
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
  const { t } = useLanguage();
  const basePath = process.env.NODE_ENV === "production" ? "/NextJS" : "";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Jackpot Slider State
  const jackpotAmounts = [50000, 100000, 250000, 500000, 1000000];
  const [activeJackpot, setActiveJackpot] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

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

  // Jackpot Slider Auto-Slide Logic
  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveJackpot((prev) => (prev + 1) % jackpotAmounts.length);
    }, 3000);

    return () => clearInterval(sliderInterval);
  }, [jackpotAmounts.length]);

  // Countdown Timer Logic
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
    { id: "RA****99", amount: "50,000" },
    { id: "MD****11", amount: "10,000" },
    { id: "TA****88", amount: "5,000" },
    { id: "SM****45", amount: "25,000" },
    { id: "KA****77", amount: "1,000" },
  ];

  const ticketTiers = [50, 100, 250, 500, 1000];

  // ==========================================
  // Loading Screen
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <svg
          className="w-12 h-12 text-white animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"
          />
        </svg>

        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">
          LOADING...
        </p>
      </div>
    );
  }

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

          {/* =====================================
              1. JACKPOT SLIDER
          ===================================== */}

          <div
            className="jackpot-slider-wrapper"
            style={{ backgroundImage: `url(${basePath}/banners-card.png)` }}
          >
            <div className="jackpot-overlay"></div>

            <div
              className="jackpot-track"
              style={{
                transform: `translateX(-${activeJackpot * 100}%)`,
              }}
            >
              {jackpotAmounts.map((amount, index) => (
                <div key={index} className="jackpot-slide">

                  <div className="jackpot-title">
                    TODAY'S JACKPOT
                  </div>

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

            <div className="jackpot-dots">
              {jackpotAmounts.map((_, index) => (
                <div
                  key={index}
                  className={`jackpot-dot ${
                    activeJackpot === index ? "active" : ""
                  }`}
                  onClick={() => setActiveJackpot(index)}
                />
              ))}
            </div>
          </div>

          {/* =====================================
              2. BUY TICKETS
          ===================================== */}

          <div>

            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">
                Buy Tickets
              </h2>

              <span className="text-[10px] text-[#F5B041] font-bold">
                Select Tier
              </span>
            </div>

            <div className="ticket-grid">

              {ticketTiers.map((price) => (
                <div
                  key={price}
                  className={`ticket-card tier-${price}`}
                  onClick={() =>
                    router.push(
                      `/Lottery/tickets-buy-activity?price=${price}`
                    )
                  }
                >

                  <div className="ticket-price">
                    ৳ {price}
                  </div>

                  <div className="ticket-label">
                    Per Ticket
                  </div>

                  <button className="buy-btn">
                    Play Now
                  </button>

                </div>
              ))}

            </div>
          </div>

          {/* =====================================
              3. LOTTERY INFORMATION
          ===================================== */}

          <section className="lottery-info-section">

            <div className="flex justify-between items-center mb-4">

              <div>
                <h2 className="section-title">
                  Lottery Information
                </h2>

                <p className="text-[10px] text-[#A6B8AE] mt-1">
                  Important lottery details
                </p>
              </div>

              <div className="trust-security-icon">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 17v-2m3 2v-4m3 4V9m2 12H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

            </div>

            <div className="lottery-info-grid">

              {/* Current Jackpot */}

              <div className="lottery-info-item">

                <div className="lottery-info-label">
                  CURRENT JACKPOT
                </div>

                <div className="lottery-info-value lottery-info-highlight">
                  ৳ {jackpotAmounts[activeJackpot].toLocaleString()}
                </div>

              </div>

              {/* Ticket Options */}

              <div className="lottery-info-item">

                <div className="lottery-info-label">
                  TICKET OPTIONS
                </div>

                <div className="lottery-info-value">
                  {ticketTiers.length}
                </div>

              </div>

              {/* Minimum Ticket Price */}

              <div className="lottery-info-item">

                <div className="lottery-info-label">
                  MINIMUM TICKET PRICE
                </div>

                <div className="lottery-info-value">
                  ৳ {Math.min(...ticketTiers).toLocaleString()}
                </div>

              </div>

              {/* Maximum Ticket Price */}

              <div className="lottery-info-item">

                <div className="lottery-info-label">
                  MAXIMUM TICKET PRICE
                </div>

                <div className="lottery-info-value lottery-info-highlight">
                  ৳ {Math.max(...ticketTiers).toLocaleString()}
                </div>

              </div>

            </div>

            {/* Draw Countdown */}

            <div className="mt-4 p-3 rounded-xl bg-[#091E16]/60 border border-[#DABE7E]/20">

              <div className="flex justify-between items-center mb-3">

                <span className="text-xs font-bold text-white">
                  DRAW COUNTDOWN
                </span>

                <span className="text-[10px] text-[#E5BD70] font-bold">
                  TIME REMAINING
                </span>

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

              <p className="text-[10px] text-[#A6B8AE] text-center mt-3">
                Countdown follows the existing page timer.
                Confirm the actual draw schedule before purchase.
              </p>

            </div>

          </section>

          {/* =====================================
              4. SMART WALLET
          ===================================== */}

          <div className="wallet-card">

            <div className="wallet-header">

              <div className="flex items-center gap-2">

                <svg
                  className="w-5 h-5 text-[#F5B041]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>

                <h4>
                  My Lottery Balance
                </h4>

              </div>

              <span className="amount">
                ৳ {Number(profile?.lottery_balance || 0).toFixed(2)}
              </span>

            </div>

            <div className="wallet-actions">

              <button
                className="withdraw-btn"
                onClick={() => router.push("/Lottery/withdraw-terms")}
              >
                Withdraw
              </button>

              <button
                className="reload-btn"
                onClick={() => router.push("/Lottery/Secure-payment")}
              >
                Reload
              </button>

            </div>

          </div>

          {/* =====================================
              5. TRUST & SECURITY
          ===================================== */}

          <section className="trust-security-section">

            <div className="flex justify-between items-center mb-4">

              <div>
                <h2 className="section-title">
                  Trust & Security
                </h2>

                <p className="text-[10px] text-[#A6B8AE] mt-1">
                  Important payment and policy information
                </p>
              </div>

              <div className="trust-security-icon">

                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="m9 12 2 2 4-4"
                  />

                </svg>

              </div>

            </div>

            <div className="trust-security-list">

              {/* Payment Information */}

              <div
                className="trust-security-item cursor-pointer"
                onClick={() =>
                  router.push("/Lottery/Secure-payment")
                }
              >

                <div className="trust-security-icon">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 10h18M5 6h14a2 2 0 012 2v10H3V8a2 2 0 012-2zm3 8h3"
                    />
                  </svg>

                </div>

                <div className="flex-1">

                  <div className="trust-security-title">
                    Payment Information
                  </div>

                  <div className="trust-security-description">
                    View available payment and reload information.
                  </div>

                </div>

                <svg
                  className="w-4 h-4 text-[#A6B8AE]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m9 18 6-6-6-6"
                  />
                </svg>

              </div>

              {/* Withdrawal Policy */}

              <div
                className="trust-security-item cursor-pointer"
                onClick={() =>
                  router.push("/Lottery/withdraw-terms")
                }
              >

                <div className="trust-security-icon">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 3v18m-7-5 7 5 7-5M5 8l7-5 7 5"
                    />
                  </svg>

                </div>

                <div className="flex-1">

                  <div className="trust-security-title">
                    Withdrawal Policy
                  </div>

                  <div className="trust-security-description">
                    Read withdrawal terms and conditions.
                  </div>

                </div>

                <svg
                  className="w-4 h-4 text-[#A6B8AE]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m9 18 6-6-6-6"
                  />
                </svg>

              </div>

              {/* Ticket Purchase Information */}

              <div className="trust-security-item">

                <div className="trust-security-icon">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 010 10v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 010-10z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      strokeDasharray="2 3"
                      d="M13 5v14"
                    />
                  </svg>

                </div>

                <div className="flex-1">

                  <div className="trust-security-title">
                    Ticket Purchase Information
                  </div>

                  <div className="trust-security-description">
                    Review ticket price and purchase details before proceeding.
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================
              6. LIVE WINNERS TICKER
          ===================================== */}

          <div>

            <div className="flex items-center gap-2 mb-3">

              <span className="w-2 h-2 rounded-full bg-[#00E701] animate-ping"></span>

              <h2 className="section-title m-0">
                Live Winners
              </h2>

            </div>

            <div className="winners-ticker-wrapper">

              <div className="winners-ticker">

                {[...mockWinners, ...mockWinners].map((winner, idx) => (

                  <div
                    key={idx}
                    className="winner-ticker-item"
                  >

                    <span className="winner-id">
                      ID: {winner.id}
                    </span>

                    <span className="winner-prize">
                      ৳ {winner.amount}
                    </span>

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
