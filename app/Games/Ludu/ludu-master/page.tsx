"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ আপনার প্রজেক্ট অনুযায়ী চেক করে নিন
import "./ludu.css";

export default function LudoMasterPage() {
  const router = useRouter();
  const t = (en: string, bn: string) => en;

  // 💰 ক্যাসিনো স্টেটস
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ডাইস স্টেট
  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  // ১. ইউজারের রিয়েল ব্যালেন্স লোড করা
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
          if (data) setBalance(data.balance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dicePatterns: Record<number, string> = {
    1: "radial-gradient(circle, black 7px, transparent 8px)",
    2: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    3: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    4: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    5: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    6: "radial-gradient(circle at 25% 20%, black 6px, transparent 7px), radial-gradient(circle at 75% 20%, black 6px, transparent 7px), radial-gradient(circle at 25% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 80%, black 6px, transparent 7px), radial-gradient(circle at 75% 80%, black 6px, transparent 7px)"
  };

  // 🎲 ডাইস রোল অ্যানিমেশন
  const rollDice = () => {
    if (!isPlaying || isRolling) return;
    setIsRolling(true);
    
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 50);
  };

  // 🚀 গেম শুরু (RPC কল)
  const startGame = async () => {
    if (betAmount > balance) {
      alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));
      return;
    }
    
    setIsProcessing(true);
    try {
      // Supabase RPC কল
      const { data, error } = await supabase.rpc("start_ludo_match", {
        p_bet_amount: betAmount
      });

      if (error) throw error;

      if (data.success) {
        setBalance(data.balance_after);
        setIsPlaying(true);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🏆 গেম শেষ (RPC কল)
  const finishGame = async (isWin: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.rpc("finish_ludo_match", {
        p_bet_amount: betAmount,
        p_is_win: isWin
      });

      if (error) throw error;

      if (data.success) {
        setBalance(data.balance_after);
        setIsPlaying(false);
        if (isWin) {
          alert(t(`You won ${(betAmount * 1.9).toFixed(2)} BDT!`, `আপনি ${(betAmount * 1.9).toFixed(2)} টাকা জিতেছেন!`));
        } else {
          alert(t("You lost the match!", "আপনি ম্যাচটি হেরেছেন!"));
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const gridCells = useMemo(() => {
    const cells = [];
    for (let r = 1; r <= 15; r++) {
      for (let c = 1; c <= 15; c++) {
        let active =
          (c >= 7 && c <= 9 && (r <= 6 || r >= 10)) ||
          (r >= 7 && r <= 9 && (c <= 6 || c >= 10));

        if (!active) continue;

        let className = "cell";
        let text = "";

        if (r >= 2 && r <= 6 && c === 8) className += " yellow-lane";
        if (r >= 10 && r <= 14 && c === 8) className += " red-lane";
        if (r === 8 && c >= 2 && c <= 6) className += " green-lane";
        if (r === 8 && c >= 10 && c <= 14) className += " blue-lane";

        if (
          (r === 3 && c === 7) ||
          (r === 7 && c === 13) ||
          (r === 13 && c === 9) ||
          (r === 9 && c === 3)
        ) {
          className += " safe";
          text = "☆";
        }

        if (r === 1 && c === 8) { text = "↓"; className += " start"; }
        if (r === 15 && c === 8) { text = "↑"; className += " start"; }
        if (r === 8 && c === 1) { text = "➜"; className += " start"; }
        if (r === 8 && c === 15) { text = "←"; className += " start"; }

        cells.push(
          <div key={`${r}-${c}`} className={className} style={{ gridRow: r, gridColumn: c }}>
            {text}
          </div>
        );
      }
    }
    return cells;
  }, []);

  const TokenSVG = ({ color }: { color: string }) => (
    <svg viewBox="0 0 64 70">
      <path d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z" fill="white" stroke="#777" strokeWidth="3" />
      <circle cx="32" cy="27" r="14" fill={color} stroke="#777" strokeWidth="2" />
    </svg>
  );

  if (loading) return <div className="ludo-wrapper" style={{color:"white", display:"flex", alignItems:"center", justifyContent:"center", height:"100vh"}}>Loading...</div>;

  return (
    <div className="ludo-wrapper">
      <div className="game">
        
        {/* 💰 WALLET HEADER */}
        <div className="wallet-header">
          <div className="wallet-box">
            <span className="wallet-label">{t("Balance", "ব্যালেন্স")}</span>
            <span className="wallet-amount">{Number(balance).toFixed(2)} BDT</span>
          </div>
          <div className="match-status">
            {isPlaying ? <span className="status-live">● {t("LIVE MATCH", "লাইভ ম্যাচ")}</span> : <span className="status-idle">{t("READY TO PLAY", "খেলতে প্রস্তুত")}</span>}
          </div>
          <div className="wallet-box ai-wallet">
            <span className="wallet-label">{t("Opponent", "প্রতিপক্ষ")}</span>
            <span className="wallet-amount">∞</span>
          </div>
        </div>

        {/* TOP PLAYER */}
        <div className="control top">
          <div className="panel">
            <div className="player-box">
              <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                <TokenSVG color="var(--yellow)" />
              </div>
            </div>
            <button className={`dice-button ${(!isPlaying || isRolling || isProcessing) ? 'disabled-dice' : ''}`} onClick={rollDice}>
              <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
            </button>
          </div>
        </div>

        {/* BOARD */}
        <div className="board">
          <div className="board-grid" id="grid">
            {gridCells}
          </div>

          <div className="home green">
            <div className="home-inner">
              <div className="home-dot"></div><div className="home-dot"></div>
              <div className="home-dot"></div><div className="home-dot"></div>
            </div>
          </div>

          <div className="home yellow">
            <div className="home-inner">
              <div className="home-dot"></div><div className="home-dot"></div>
              <div className="home-dot"></div><div className="home-dot"></div>
            </div>
            <div className="player-name">Player 2</div>
          </div>

          <div className="home red">
            <div className="home-inner">
              <div className="home-dot"></div><div className="home-dot"></div>
              <div className="home-dot"></div><div className="home-dot"></div>
            </div>
            <div className="player-name">Player 1</div>
          </div>

          <div className="home blue">
            <div className="home-inner">
              <div className="home-dot"></div><div className="home-dot"></div>
              <div className="home-dot"></div><div className="home-dot"></div>
            </div>
          </div>

          <div className="center">
            <div className="triangle yellow"></div>
            <div className="triangle blue"></div>
            <div className="triangle red"></div>
            <div className="triangle green"></div>
          </div>

          <div className="token token-yellow-1"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-yellow-2"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-yellow-3"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-blue-1"><TokenSVG color="var(--blue)" /></div>
          <div className="token token-red-1"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-2"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-3"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-4"><TokenSVG color="var(--red)" /></div>
        </div>

        {/* BETTING OR CONTROLS */}
        {!isPlaying ? (
          <div className="betting-panel">
            <div className="bet-info">
              <span>{t("Bet Amount", "বাজির পরিমাণ")}</span>
              <div className="bet-controls">
                <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))}>-</button>
                <input type="number" value={betAmount} readOnly />
                <button onClick={() => setBetAmount(betAmount + 10)}>+</button>
              </div>
            </div>
            
            <div className="quick-chips">
              {[50, 100, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt)} className={betAmount === amt ? 'active' : ''}>
                  {amt}
                </button>
              ))}
            </div>

            <div className="potential-win">
              <span>{t("Potential Win", "সম্ভাব্য জয়")}</span>
              <strong>{(betAmount * 1.9).toFixed(2)} BDT</strong>
            </div>

            <button className="start-btn" onClick={startGame} disabled={isProcessing}>
              {isProcessing ? t("STARTING...", "শুরু হচ্ছে...") : t("START MATCH", "ম্যাচ শুরু করুন")}
            </button>
          </div>
        ) : (
          <div className="control bottom">
            <div className="panel">
              <div className="player-box">
                <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                  <TokenSVG color="var(--red)" />
                </div>
              </div>
              <button className={`dice-button ${(isRolling || isProcessing) ? 'disabled-dice' : ''}`} onClick={rollDice}>
                <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
              </button>
              <div className="arrow">◀</div>
            </div>
            
            {/* ডেমো ফিনিশ বাটন (পরে এটি অটোমেটিক এআই জেতা/হারার সাথে কানেক্ট হবে) */}
            <div style={{display:"flex", flexDirection:"column", gap:"5px", marginLeft:"auto", marginRight:"3%"}}>
                <button className="finish-demo-btn" style={{background:"#00e701", margin:0}} onClick={() => finishGame(true)} disabled={isProcessing}>Win Demo</button>
                <button className="finish-demo-btn" style={{background:"#ff4d4d", margin:0}} onClick={() => finishGame(false)} disabled={isProcessing}>Lose Demo</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
