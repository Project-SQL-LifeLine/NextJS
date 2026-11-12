"use client";

import { useState, useMemo } from "react";
import "./ludu.css";

export default function LudoMasterPage() {
  // Language Toggle Placeholder (আপনার প্রজেক্টের গ্লোবাল ফাংশন দিয়ে রিপ্লেস করবেন)
  const t = (en: string, bn: string) => en;

  // ডাইস স্টেট
  const [diceVal, setDiceVal] = useState(1);

  // ডাইসের ডট প্যাটার্ন (আপনার দেওয়া কোড থেকে নেওয়া)
  const dicePatterns: Record<number, string> = {
    1: "radial-gradient(circle, black 7px, transparent 8px)",
    2: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    3: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    4: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    5: "radial-gradient(circle at 25% 25%, black 6px, transparent 7px), radial-gradient(circle at 75% 25%, black 6px, transparent 7px), radial-gradient(circle at 50% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 75%, black 6px, transparent 7px), radial-gradient(circle at 75% 75%, black 6px, transparent 7px)",
    6: "radial-gradient(circle at 25% 20%, black 6px, transparent 7px), radial-gradient(circle at 75% 20%, black 6px, transparent 7px), radial-gradient(circle at 25% 50%, black 6px, transparent 7px), radial-gradient(circle at 75% 50%, black 6px, transparent 7px), radial-gradient(circle at 25% 80%, black 6px, transparent 7px), radial-gradient(circle at 75% 80%, black 6px, transparent 7px)"
  };

  // ডাইস রোল করার ফাংশন
  const rollDice = () => {
    const n = Math.floor(Math.random() * 6) + 1;
    setDiceVal(n);
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

        // লেইন কালার
        if (r >= 2 && r <= 6 && c === 8) className += " yellow-lane";
        if (r >= 10 && r <= 14 && c === 8) className += " red-lane";
        if (r === 8 && c >= 2 && c <= 6) className += " green-lane";
        if (r === 8 && c >= 10 && c <= 14) className += " blue-lane";

        // সেফ জোন
        if (
          (r === 3 && c === 7) ||
          (r === 7 && c === 13) ||
          (r === 13 && c === 9) ||
          (r === 9 && c === 3)
        ) {
          className += " safe";
          text = "☆";
        }

        // স্টার্ট পয়েন্ট
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

  // পন (Token) SVG কম্পোনেন্ট
  const TokenSVG = ({ color }: { color: string }) => (
    <svg viewBox="0 0 64 70">
      <path d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z" fill="white" stroke="#777" strokeWidth="3" />
      <circle cx="32" cy="27" r="14" fill={color} stroke="#777" strokeWidth="2" />
    </svg>
  );

  return (
    <div className="ludo-wrapper">
      <div className="game">

        {/* TOP PLAYER (Yellow) */}
        <div className="control top">
          <div className="panel">
            <div className="player-box">
              <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                <TokenSVG color="var(--yellow)" />
              </div>
            </div>
            <button className="dice-button" onClick={rollDice}>
              <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
            </button>
          </div>
        </div>

        {/* BOARD */}
        <div className="board">
          <div className="board-grid" id="grid">
            {gridCells}
          </div>

          {/* HOMES */}
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

          {/* CENTER */}
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

        {/* BOTTOM PLAYER (Red) */}
        <div className="control bottom">
          <div className="panel">
            <div className="player-box">
              <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}>
                <TokenSVG color="var(--red)" />
              </div>
            </div>
            <button className="dice-button" onClick={rollDice}>
              <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
            </button>
            <div className="arrow">◀</div>
          </div>
        </div>

      </div>
    </div>
  );
}
