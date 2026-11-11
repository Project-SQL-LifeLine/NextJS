"use client";

import { useState, useEffect, useRef } from "react";
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
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);

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
    
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
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

    // অ্যানিমেশন
    animationRef.current = setInterval(() => {
      setRollResult(Math.random() * 100);
    }, 50);

    try {
      const { data, error } = await supabase.rpc("play_dice", {
        p_bet_amount: betAmount,
        p_target: target,
        p_is_over: isOver
      });

      if (error) throw error;

      setTimeout(() => {
        if (animationRef.current) clearInterval(animationRef.current);
        
        if (data.success) {
          setRollResult(data.roll);
          setWinStatus(data.is_win ? "win" : "lose");
          setProfile({ ...profile, balance: data.balance_after });
        } else {
          alert(data.error);
        }
        setIsRolling(false);
      }, 800);

    } catch (err: any) {
      if (animationRef.current) clearInterval(animationRef.current);
      alert(err.message);
      setIsRolling(false);
    }
  };

  // স্লাইডারের ব্যাকগ্রাউন্ড কালার (Under হলে বাম দিকে লাল, Over হলে ডান দিকে লাল)
  const trackStyle = {
    background: `linear-gradient(to right, 
      #ef4444 0%, #ef4444 ${!isOver ? 0 : target}%, 
      #3b82f6 ${!isOver ? 0 : target}%, #3b82f6 ${!isOver ? target : 100}%, 
      #ef4444 ${!isOver ? target : 100}%, #ef4444 100%)`
  };

  if (loading) return <div className="dice-fullscreen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dice-fullscreen">
      
      {/* টপ বার (হুবহু ছবির মতো) */}
      <div className="dice-top-bar">
        <button className="back-btn" onClick={() => router.back()}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div className="center-tab">
          DICE <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>

        <button className="refresh-btn">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* মেইন কন্টেন্ট এরিয়া */}
      <div className="game-main-area">
        
        {/* বড় রেজাল্ট ডিসপ্লে */}
        <div className={`big-number ${winStatus === "win" ? "text-green-400" : winStatus === "lose" ? "text-red-400" : ""}`}>
          {isRolling ? (rollResult !== null ? rollResult.toFixed(2) : "00.00") : (rollResult !== null ? rollResult.toFixed(2) : target.toFixed(2))}
        </div>

        {/* কাস্টম স্লাইডার */}
        <div className="slider-container">
          <div className="slider-marks">
            <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
          </div>
          <div className="slider-track-wrapper">
            <div className="slider-track-bg" style={trackStyle}></div>
            {/* নিচের সবুজ দাগ */}
            <div className="slider-track-bottom-line"></div>
            
            <input 
              type="range" 
              min="2" 
              max="98" 
              step="0.01"
              value={target}
              onChange={(e) => { setTarget(Number(e.target.value)); setRollResult(null); setWinStatus(null); }}
              className="slider-input"
              disabled={isRolling}
            />
          </div>
          <div className="slider-labels">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* পেআউট বক্স */}
        <div className="payout-box">
          <div className="payout-top-row">
            <div className="payout-pill">
              <span className="p-label">Payout</span>
              <span className="p-value">{multiplier.toFixed(2)} x</span>
            </div>
            <div className="payout-slider-track">
              <div className="payout-slider-thumb">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l4 4H6l4-4zm0 14l-4-4h8l-4 4z" /></svg>
              </div>
            </div>
          </div>
          <div className="payout-bottom-row">
            <div className="p-bottom-item">
              <span className="p-label">Potential win:</span>
              <span className="p-val">{potentialWin.toFixed(2)} BDT</span>
            </div>
            <div className="p-bottom-item text-right">
              <span className="p-label">Chance:</span>
              <span className="p-val">{winChance.toFixed(2)} %</span>
            </div>
          </div>
        </div>

      </div>

      {/* কন্ট্রোল প্যানেল */}
      <div className="control-panel">
        
        {/* Under / Over বাটন */}
        <div className="action-row">
          <button className="btn-blue-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          
          <button 
            className={`btn-under ${!isOver ? "active" : ""}`}
            onClick={() => setIsOver(false)}
            disabled={isRolling}
          >
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            <div className="inner-badge">{target.toFixed(2)}</div>
          </button>
          
          <button 
            className={`btn-over ${isOver ? "active" : ""}`}
            onClick={() => setIsOver(true)}
            disabled={isRolling}
          >
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            <div className="inner-badge">{(100 - target).toFixed(2)}</div>
          </button>
        </div>

        {/* বেট ইনপুট এবং বাটন */}
        <div className="bet-row">
          <div className="bet-input-wrapper">
            <span className="bet-label">Bet BDT</span>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={isRolling}
              className="bet-input"
            />
          </div>
          <button className="btn-square" onClick={() => setBetAmount(Math.max(1, betAmount - 1))} disabled={isRolling}>
            −
          </button>
          <button className="btn-square" onClick={() => setBetAmount(profile?.balance || 1)} disabled={isRolling}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </button>
          <button className="btn-square" onClick={() => setBetAmount(betAmount + 1)} disabled={isRolling}>
            +
          </button>
        </div>

        {/* মেইন রোল বাটন */}
        <button className="btn-roll" onClick={handleRoll} disabled={isRolling}>
          {isRolling ? "ROLLING..." : "ROLL"}
        </button>

      </div>
    </div>
  );
}
