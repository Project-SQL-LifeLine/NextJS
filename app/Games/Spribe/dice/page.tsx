"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import "./dice.css";

export default function DiceGamePage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [betAmount, setBetAmount] = useState<number>(1.00);
  const [target, setTarget] = useState<number>(50.00);
  const [isOver, setIsOver] = useState<boolean>(false);
  
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<"win" | "lose" | null>(null);
  
  // ডামি হিস্ট্রি (পরে ডাটাবেস থেকে আসবে)
  const [history, setHistory] = useState([95.01, 44.33, 55.33, 85.45, 19.17, 49.00]);

  // লাইভ ম্যাথ
  const winChance = isOver ? 100 - target : target;
  const multiplier = winChance > 0 ? (99 / winChance) : 0;
  const potentialWin = betAmount * multiplier;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
        if (data) setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleRoll = async () => {
    if (!profile || betAmount <= 0) return;
    if (betAmount > profile.balance) {
      alert("Insufficient balance!");
      return;
    }

    setIsRolling(true);
    setWinStatus(null);
    setRollResult(null);

    // রোলিং অ্যানিমেশন (আপনি চাইলে ডাটাবেস কলের আগে এটি রাখতে পারেন)
    const animInterval = setInterval(() => {
      setRollResult(Math.random() * 100);
    }, 50);

    try {
      // আসল RPC কল
      const { data, error } = await supabase.rpc("play_dice", {
        p_bet_amount: betAmount,
        p_target: target,
        p_is_over: isOver
      });

      if (error) throw error;

      setTimeout(() => {
        clearInterval(animInterval);
        
        if (data.success) {
          setRollResult(data.roll);
          setWinStatus(data.is_win ? "win" : "lose");
          setProfile({ ...profile, balance: data.balance_after });
          setHistory(prev => [data.roll, ...prev].slice(0, 6));
        } else {
          alert(data.error);
        }
        setIsRolling(false);
      }, 800);

    } catch (err: any) {
      clearInterval(animInterval);
      alert(err.message);
      setIsRolling(false);
    }
  };

  if (loading) return <div className="dice-page bg-[#421b7a] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dice-page">
      <div className="dice-app">
        
        {/* ================= টপ হেডার ================= */}
        <div className="dice-header">
          <div className="notch">▼</div>
          <div className="history-bar">
            {history.map((val, idx) => (
              <div key={idx} className={`history-item ${val > 50 ? "win" : ""}`}>
                {val.toFixed(2)}
              </div>
            ))}
            <button className="refresh-icon-btn" onClick={() => window.location.reload()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* ================= মেইন গেম সেকশন ================= */}
        <div className="game-section">
          
          {/* রেজাল্ট নাম্বার */}
          <div className={`result-number ${winStatus === "win" ? "text-green" : winStatus === "lose" ? "text-red" : ""}`}>
            {isRolling ? (rollResult !== null ? rollResult.toFixed(2) : "00.00") : (rollResult !== null ? rollResult.toFixed(2) : target.toFixed(2))}
          </div>

          {/* কাস্টম স্লাইডার */}
          <div className="slider-container">
            <div className="slider-ticks-top">
              <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
            </div>
            <div className="slider-track-wrapper">
              <div className="slider-bars">
                <div className="bar-red" style={{ width: isOver ? `${target}%` : `${target}%` }}></div>
                <div className="bar-blue" style={{ width: isOver ? `${100-target}%` : `${100-target}%` }}></div>
              </div>
              <div className="slider-bottom-green"></div>
              
              <input 
                type="range" min="2" max="98" step="0.01" 
                value={target}
                onChange={(e) => { setTarget(Number(e.target.value)); setRollResult(null); setWinStatus(null); }}
                className="slider-input" disabled={isRolling}
              />
            </div>
            <div className="slider-numbers">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>

          {/* পেআউট সেকশন */}
          <div className="payout-section">
            <div className="payout-top">
              <div className="payout-pill">
                <span className="label">Payout</span>
                <span className="value">{multiplier.toFixed(2)} x</span>
              </div>
              <div className="payout-slider">
                <div className="payout-thumb">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                </div>
              </div>
            </div>
            <div className="payout-bottom">
              <div className="p-info">
                <span className="label">Potential win:</span>
                <span className="val">{potentialWin.toFixed(2)} BDT</span>
              </div>
              <div className="p-info text-right">
                <span className="label">Chance:</span>
                <span className="val">{winChance.toFixed(2)} %</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= কন্ট্রোল প্যানেল ================= */}
        <div className="control-section">
          
          <div className="btn-row">
            <button className="btn-refresh-blue" onClick={() => window.location.reload()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            
            <button 
              className={`btn-under ${!isOver ? "active" : ""}`}
              onClick={() => setIsOver(false)} disabled={isRolling}
            >
              <span className="arrow">⌄</span>
              <span className="badge">{target.toFixed(2)}</span>
            </button>
            
            <button 
              className={`btn-over ${isOver ? "active" : ""}`}
              onClick={() => setIsOver(true)} disabled={isRolling}
            >
              <span className="arrow">⌃</span>
              <span className="badge">{(100 - target).toFixed(2)}</span>
            </button>
          </div>

          <div className="bet-input-row">
            <div className="bet-pill">
              <span className="bet-label">Bet BDT</span>
              <input 
                type="number" value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isRolling} className="bet-field"
              />
            </div>
            <button className="btn-small-round" onClick={() => setBetAmount(Math.max(1, betAmount - 1))}>−</button>
            <button className="btn-small-round" onClick={() => setBetAmount(profile?.balance || 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>
            <button className="btn-small-round" onClick={() => setBetAmount(betAmount + 1)}>+</button>
          </div>

          <button className="btn-main-roll" onClick={handleRoll} disabled={isRolling}>
            {isRolling ? "ROLLING..." : "ROLL"}
          </button>
        </div>

        {/* ================= ফুটার ================= */}
        <div className="footer-bar">
          <button className="btn-dice-label">DICE</button>
          <button className="btn-help">?</button>
          <div className="balance-text">{Number(profile?.balance || 0).toFixed(2)} BDT</div>
          <button className="btn-menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}
