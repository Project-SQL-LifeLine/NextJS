"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ আপনার প্রজেক্ট অনুযায়ী চেক করে নিন
import "./dice.css";

export default function DiceGamePage() {
  const router = useRouter();

  // প্রোফাইল ও ব্যালেন্স
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // গেম স্টেট
  const [bet, setBet] = useState(1.00);
  const [chance, setChance] = useState(48.5);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  
  // মেনু স্টেট
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // হিস্ট্রি স্টেট
  const [historyData, setHistoryData] = useState<any[]>([]);

  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const payout = 99 / chance;
  const highChance = 100 - chance;
  const potentialWin = bet * payout;

  // ডাটা লোড
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
          if (data) setProfile(data);

          // আগের ড্র-এর হিস্ট্রি আনা
          const { data: history } = await supabase
            .from("original_bets_history")
            .select("roll_value, is_win")
            .eq("user_id", user.id)
            .eq("game_name", "dice")
            .order("created_at", { ascending: false })
            .limit(6);

          if (history) {
            setHistoryData(history.map(h => ({
              val: Number(h.roll_value).toFixed(2),
              isGreen: h.is_win
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoll = async (isHigh: boolean) => {
    if (!profile || bet <= 0) return;
    if (bet > profile.balance) {
      alert("Insufficient balance!");
      return;
    }

    setIsRolling(true);
    setIsWin(null);
    setResult(null);

    // অ্যানিমেশন শুরু (১ সেকেন্ড)
    let rollCount = 0;
    animationRef.current = setInterval(() => {
      setResult(Math.random() * 100);
      rollCount++;
    }, 50);

    try {
      // আসল RPC কল
      const { data, error } = await supabase.rpc("play_dice", {
        p_bet_amount: bet,
        p_target: chance,
        p_is_over: isHigh
      });

      if (error) throw error;

      setTimeout(() => {
        if (animationRef.current) clearInterval(animationRef.current);
        
        if (data.success) {
          setResult(Number(data.roll));
          setIsWin(data.is_win);
          setProfile({ ...profile, balance: data.balance_after });
          
          // হিস্ট্রি আপডেট
          setHistoryData(prev => [
            { val: Number(data.roll).toFixed(2), isGreen: data.is_win },
            ...prev
          ].slice(0, 6));
        } else {
          alert(data.error);
          setResult(null);
        }
        setIsRolling(false);
      }, 1000); // ১ সেকেন্ড পর আসল রেজাল্ট দেখাবে

    } catch (err: any) {
      if (animationRef.current) clearInterval(animationRef.current);
      alert(err.message);
      setIsRolling(false);
    }
  };

  if (loading) return <div className="dice-page-wrapper flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dice-page-wrapper">
      <main className="game-shell">

        {/* TOP MENU POPUP */}
        {isMenuOpen && (
          <div className="top-menu-popup">
            <button className="menu-item" onClick={() => router.back()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>Back</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span>Add<br/>Favorite</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <span>My favorites</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>Search</span>
            </button>
            <button className="menu-item" onClick={() => router.push('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Home</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              <span>Fullscreen</span>
            </button>
          </div>
        )}

        {/* HISTORY */}
        <section className="history">
          {historyData.length > 0 ? historyData.map((item, idx) => (
            <div key={idx} className={`history-item ${item.isGreen ? "green" : "white"}`}>
              {item.val}
            </div>
          )) : <div className="text-xs text-gray-400 w-full text-center">No History</div>}
          <button className="history-menu">◴⌄</button>
        </section>

        {/* RESULT & GRAPH PANEL */}
        <section className="result-panel">
          
          {/* Menu Arrow (Notch) */}
          <div className="notch" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? "▲" : "▼"}
          </div>

          <div 
            className="result-number" 
            id="result"
            style={{ color: isWin === true ? "#36bd00" : isWin === false ? "#ff4d4d" : (result === null ? "transparent" : "#36bd00") }}
          >
            {result !== null ? result.toFixed(2) : "00.00"}
          </div>

          <div className="chart-area">
            <div className="scale">
              <i></i><i></i><i></i><i></i><i></i>
            </div>

            <div className="bars">
              <div className="bar bar-one">
                <div className="red" style={{ width: `${100 - chance}%` }}></div>
                <div className="cyan" style={{ width: `${chance}%` }}></div>
              </div>
              <div className="bar bar-two">
                <div className="mint" style={{ width: `${chance}%` }}></div>
                <div className="red" style={{ width: `${100 - chance}%` }}></div>
              </div>
            </div>

            <div 
              className="ball" 
              style={{ 
                left: `calc(${result !== null ? result : 0}% - 22px)`,
                right: 'auto',
                top: 'calc(50% - 6px)',
                opacity: result !== null ? 1 : 0
              }}
            ></div>

            <div className="axis">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </section>

        {/* PAYOUT & SLIDER */}
        <section className="payout">
          <div className="payout-top">
            <div>
              <div className="payout-label">Payout</div>
              <div className="multiplier" id="multiplier">{payout.toFixed(2)} x</div>
            </div>

            <div className="slider-wrap">
              <input
                id="chanceSlider"
                type="range"
                min="1"
                max="95"
                step="0.01"
                value={chance}
                onChange={(e) => setChance(Number(e.target.value))}
                disabled={isRolling}
              />
              <div className="ticks">
                <i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i>
              </div>
            </div>
          </div>

          <div className="payout-bottom">
            <div>
              <div className="small-label">Potential win:</div>
              <div className="small-value" id="potential">{potentialWin.toFixed(2)} BDT</div>
            </div>
            <div>
              <span className="small-label">Chance: </span>
              <span className="small-value" id="chance">{chance.toFixed(2)} %</span>
            </div>
          </div>
        </section>

        {/* BET AREA */}
        <section className="bet-area">
          <div className="action-row">
            
            {/* Rebet / Roll Button */}
            <button className="action-btn roll" id="roll" onClick={() => handleRoll(false)} disabled={isRolling}>
              <svg style={{ width: '28px', height: '28px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>

            {/* Low (Under) Button */}
            <button className="action-btn low" id="low" onClick={() => handleRoll(false)} disabled={isRolling}>
              <svg className="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span className="prob" id="lowChance">{chance.toFixed(2)}</span>
            </button>

            {/* High (Over) Button */}
            <button className="action-btn high" id="high" onClick={() => handleRoll(true)} disabled={isRolling}>
              <svg className="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="prob" id="highChance">{highChance.toFixed(2)}</span>
            </button>

          </div>

          <div className="bet-row">
            <div className="bet-input-wrapper">
              <div className="bet-label">Bet BDT</div>
              <div className="bet-input" id="betValue">{bet.toFixed(2)}</div>
            </div>

            <button className="round-control" id="minus" onClick={() => setBet(Math.max(0.01, bet - 1))}>−</button>
            <button className="round-control coins" id="half" onClick={() => setBet(Math.max(0.01, bet / 2))}>▤</button>
            <button className="round-control" id="plus" onClick={() => setBet(Math.min(999999, bet + 1))}>+</button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="dice-tab">DICE</div>
          <div className="help">?</div>
          <div className="balance">
            {Number(profile?.balance || 0).toFixed(2)} <span>BDT</span>
          </div>
          <button className="menu">☰</button>
        </footer>

      </main>
    </div>
  );
}
