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

    // অ্যানিমেশন (রোলিং ইফেক্ট)
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

      // আসল রেজাল্ট দেখানোর জন্য ১ সেকেন্ড অপেক্ষা
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

  // স্লাইডারের রঙিন ব্যাকগ্রাউন্ড
  const trackStyle = {
    background: `linear-gradient(to right, 
      #ef4444 0%, #ef4444 ${isOver ? target : 0}%, 
      #3b82f6 ${isOver ? target : 0}%, #3b82f6 ${isOver ? 100 : target}%, 
      #ef4444 ${isOver ? 100 : target}%, #ef4444 100%)`
  };

  if (loading) return <div className="dice-fullscreen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dice-fullscreen">
      
      {/* টপ বার */}
      <div className="dice-top-header">
        <button className="dice-back-btn" onClick={() => router.back()}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="dice-tab-indicator">
          <span>DICE</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
        <div className="dice-top-right">
          <button className="dice-icon-btn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* মেইন গেম এরিয়া */}
      <div className="dice-content-area">
        
        {/* বড় রেজাল্ট ডিসপ্লে */}
        <div className={`dice-big-number ${winStatus === "win" ? "text-green-400" : winStatus === "lose" ? "text-red-400" : ""}`}>
          {isRolling ? (rollResult !== null ? rollResult.toFixed(2) : "00.00") : (rollResult !== null ? rollResult.toFixed(2) : target.toFixed(2))}
        </div>

        {/* কাস্টম স্লাইডার */}
        <div className="dice-slider-wrapper">
          <div className="dice-slider-track-bg" style={trackStyle}></div>
          
          {/* টিক মার্কস */}
          <div className="dice-slider-ticks">
            <div className="tick"></div>
            <div className="tick"></div>
            <div className="tick"></div>
            <div className="tick"></div>
            <div className="tick"></div>
          </div>
          
          <input 
            type="range" 
            min="2" 
            max="98" 
            step="0.01"
            value={target}
            onChange={(e) => { setTarget(Number(e.target.value)); setRollResult(null); setWinStatus(null); }}
            className="dice-range-input"
            disabled={isRolling}
          />
          
          <div className="dice-slider-numbers">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* পেআউট বক্স */}
        <div className="dice-payout-container">
          <div className="dice-payout-top">
            <div className="payout-value-box">
              <span className="label">Payout</span>
              <span className="value">{multiplier.toFixed(2)} x</span>
            </div>
            <div className="payout-slider">
              <div className="payout-slider-circle">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
              </div>
            </div>
          </div>
          <div className="dice-payout-bottom">
            <div className="potential-win">
              Potential win: <br/> <strong>{potentialWin.toFixed(2)} BDT</strong>
            </div>
            <div className="chance-win">
              Chance: <br/> <strong>{winChance.toFixed(2)} %</strong>
            </div>
          </div>
        </div>

      </div>

      {/* কন্ট্রোল প্যানেল */}
      <div className="dice-control-panel">
        
        {/* Under / Over বাটন */}
        <div className="dice-action-row">
          <button className="dice-icon-blue-btn">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          
          <button 
            className={`dice-btn-under ${!isOver ? "active" : ""}`}
            onClick={() => setIsOver(false)}
            disabled={isRolling}
          >
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            <span className="btn-badge">{target.toFixed(2)}</span>
          </button>
          
          <button 
            className={`dice-btn-over ${isOver ? "active" : ""}`}
            onClick={() => setIsOver(true)}
            disabled={isRolling}
          >
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            <span className="btn-badge">{(100 - target).toFixed(2)}</span>
          </button>
        </div>

        {/* বেট ইনপুট */}
        <div className="dice-bet-row">
          <div className="dice-bet-input-container">
            <span className="bet-label">Bet BDT</span>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={isRolling}
              className="bet-input"
            />
          </div>
          <div className="dice-bet-actions">
            <button className="bet-action-btn" onClick={() => setBetAmount(Math.max(1, betAmount - 1))} disabled={isRolling}>−</button>
            <button className="bet-action-btn" onClick={() => setBetAmount(profile?.balance || 1)} disabled={isRolling}>
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>
            <button className="bet-action-btn" onClick={() => setBetAmount(betAmount + 1)} disabled={isRolling}>+</button>
          </div>
        </div>

        {/* মেইন রোল বাটন */}
        <button className="dice-main-roll-btn" onClick={handleRoll} disabled={isRolling}>
          {isRolling ? "ROLLING..." : "ROLL"}
        </button>

      </div>

      {/* নিচের ফুটার বার */}
      <div className="dice-footer-bar">
        <button className="footer-dice-btn">DICE</button>
        <div className="footer-help-icon">?</div>
        <div className="footer-balance">{Number(profile?.balance || 0).toFixed(2)} BDT</div>
        <button className="footer-menu-btn">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
    </div>
  );
}
