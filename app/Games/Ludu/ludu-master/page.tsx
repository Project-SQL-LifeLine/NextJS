"use client";

import { useState, useMemo } from "react";
import "./ludu.css";

export default function LudoMasterPage() {
  // Language Toggle Placeholder
  const t = (en: string, bn: string) => en;

  // 💰 ক্যাসিনো স্টেটস (নতুন)
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);

  // ডাইস স্টেট
  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  // ডাইসের ডট প্যাটার্ন
  const dicePatterns: Record<number, string> = {
    1: "radial-gradient(circle, black 7px, transparent 8px)",
    2: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    3: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    4: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    5: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    6: "radial-gradient(circle at 25% 20%, black 6px, transparent 7px), radial-gradient(circle at 75% 20%, black 6px, transparent 7px), radial-gradient(circle at 25% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 80%, black 6px, transparent 7px), radial-gradient(circle at 75% 80%, black 6px, transparent 7px)"
  };

  // 🎲 ডাইস রোল করার ফাংশন
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

  // 🚀 গেম শুরু করার ফাংশন (ব্যালেন্স কাটা হবে)
  const startGame = () => {
    if (betAmount > balance) {
      alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));
      return;
    }
    setBalance((prev) => prev - betAmount);
    setIsPlaying(true);
    setGameResult(null);
  };

  // 🏆 গেম শেষ করার ফাংশন (ডেমো - জেতার পর ব্যালেন্স যোগ)
  const finishGame = (isWin: boolean) => {
    setIsPlaying(false);
    if (isWin) {
      const winAmount = betAmount * 1.9; // 10% house edge
      setBalance((prev) => prev + winAmount);
      setGameResult("WIN");
    } else {
      setGameResult("LOSS");
    }
  };

  // ১৫x১৫ বোর্ড গ্রিড জেনারেট করা
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

  return (
    <div className="ludo-wrapper">
      <div className="game">
        
        {/* 💰 NEW: WALLET / BALANCE HEADER */}
        <div className="wallet-header">
          <div className="wallet-box">
            <span className="wallet-label">{t("Balance", "ব্যালেন্স")}</span>
            <span className="wallet-amount">{balance.toFixed(2)} BDT</span>
          </div>
          <div className="match-status">
            {isPlaying ? <span className="status-live">● {t("LIVE MATCH", "লাইভ ম্যাচ")}</span> : <span className="status-idle">{t("READY TO PLAY", "খেলতে প্রস্তুত")}</span>}
          </div>
          <div className="wallet-box ai-wallet">
            <span className="wallet-label">{t("Opponent", "প্রতিপক্ষ")}</span>
            <span className="wallet-amount">∞</span>
          </div>
        </div>

        {/* TOP PLAYER (Yellow) */}
        <div className="control top">
          <div className="panel">
            <div className="player-box">
              <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                <TokenSVG color="var(--yellow)" />
              </div>
            </div>
            <button className={`dice-button ${(!isPlaying || isRolling) ? 'disabled-dice' : ''}`} onClick={rollDice}>
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

          {/* ACTIVE TOKENS */}
          <div className="token token-yellow-1"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-yellow-2"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-yellow-3"><TokenSVG color="var(--yellow)" /></div>
          <div className="token token-blue-1"><TokenSVG color="var(--blue)" /></div>
          <div className="token token-red-1"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-2"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-3"><TokenSVG color="var(--red)" /></div>
          <div className="token token-red-4"><TokenSVG color="var(--red)" /></div>
        </div>

        {/* 💰 NEW: BETTING PANEL (Shows when not playing) */}
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

            <button className="start-btn" onClick={startGame}>
              {t("START MATCH", "ম্যাচ শুরু করুন")}
            </button>
          </div>
        ) : (
          /* BOTTOM PLAYER (Red) - Shows when playing */
          <div className="control bottom">
            <div className="panel">
              <div className="player-box">
                <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                  <TokenSVG color="var(--red)" />
                </div>
              </div>
              <button className={`dice-button ${isRolling ? 'disabled-dice' : ''}`} onClick={rollDice}>
                <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
              </button>
              <div className="arrow">◀</div>
            </div>
            {/* ডেমো ফিনিশ বাটন */}
            <button className="finish-demo-btn" onClick={() => finishGame(true)}>Finish</button>
          </div>
        )}

      </div>
    </div>
  );
}
