"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
// import { supabase } from "../../../../lib/supabase/client"; // আপনার পাথ অনুযায়ী চেক করে নিন
import "./ludu.css";

export default function LudoMasterPage() {
  const router = useRouter();

  // Language Toggle Placeholder (আপনার প্রজেক্টের গ্লোবাল ফাংশন দিয়ে রিপ্লেস করবেন)
  const t = (en: string, bn: string) => en;

  // গেম স্টেট
  const [playerBalance, setPlayerBalance] = useState(1000);
  const [aiBalance, setAiBalance] = useState(15450);
  const [diceValue, setDiceValue] = useState(3);
  const [isRolling, setIsRolling] = useState(false);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [timeLeft, setTimeLeft] = useState(15);

  // টাইমার লজিক (রিয়েল ফিল আনার জন্য)
  useEffect(() => {
    if (timeLeft === 0) {
      if (turn === 'player') {
        handleTurnChange('ai');
      } else {
        handleTurnChange('player');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, turn]);

  const handleTurnChange = (newTurn: 'player' | 'ai') => {
    setTurn(newTurn);
    setTimeLeft(15);
    if (newTurn === 'ai') {
      // ডেমো এআই অটো প্লে
      setTimeout(() => {
        handleRoll();
      }, 2000);
    }
  };

  // 🎲 SVG Pawn Generator (Premium Casino Style)
  const goldPawnSVG = useMemo(() => (
    <svg viewBox="0 0 100 100" className="token-svg p">
      <defs>
        <radialGradient id="goldHead" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="30%" stopColor="#ffdf8a"/>
          <stop offset="80%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#B8860B"/>
        </radialGradient>
        <linearGradient id="goldBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8a5a14"/>
          <stop offset="30%" stopColor="#FFD700"/>
          <stop offset="70%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#5c3a08"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="85" rx="34" ry="13" fill="url(#goldBody)" stroke="#3a2505" strokeWidth="2"/>
      <path d="M 30 85 Q 38 55 40 50 L 60 50 Q 62 55 70 85 Z" fill="url(#goldBody)" stroke="#5c3a08" strokeWidth="1.5"/>
      <ellipse cx="50" cy="50" rx="18" ry="8" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="50" cy="30" r="19" fill="url(#goldHead)" stroke="#B8860B" strokeWidth="1.5"/>
      <ellipse cx="43" cy="24" rx="7" ry="4" fill="#ffffff" opacity="0.8" transform="rotate(-30 43 24)"/>
    </svg>
  ), []);

  const redPawnSVG = useMemo(() => (
    <svg viewBox="0 0 100 100" className="token-svg a">
      <defs>
        <radialGradient id="redHead" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="30%" stopColor="#ff9999"/>
          <stop offset="80%" stopColor="#FF3333"/>
          <stop offset="100%" stopColor="#8B0000"/>
        </radialGradient>
        <linearGradient id="redBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5c0000"/>
          <stop offset="30%" stopColor="#FF3333"/>
          <stop offset="70%" stopColor="#FF3333"/>
          <stop offset="100%" stopColor="#3a0000"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="85" rx="34" ry="13" fill="url(#redBody)" stroke="#2a0000" strokeWidth="2"/>
      <path d="M 30 85 Q 38 55 40 50 L 60 50 Q 62 55 70 85 Z" fill="url(#redBody)" stroke="#3a0000" strokeWidth="1.5"/>
      <ellipse cx="50" cy="50" rx="18" ry="8" fill="#FF3333" stroke="#8B0000" strokeWidth="1.5"/>
      <circle cx="50" cy="30" r="19" fill="url(#redHead)" stroke="#8B0000" strokeWidth="1.5"/>
      <ellipse cx="43" cy="24" rx="7" ry="4" fill="#ffffff" opacity="0.8" transform="rotate(-30 43 24)"/>
    </svg>
  ), []);

  // ডাইস রোল করার লজিক (RPC পরবর্তীতে যুক্ত হবে)
  const handleRoll = () => {
    if (isRolling || turn !== 'player') return;
    
    setIsRolling(true);
    setTimeLeft(15); // টাইমার রিসেট
    
    // ডাইস অ্যানিমেশন
    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(interval);
        setIsRolling(false);
        
        // ডেমো: রোল শেষে টার্ন চেঞ্জ (আসল লজিকে টোকেন মুভমেন্টের ওপর ভিত্তি করে হবে)
        setTimeout(() => {
          handleTurnChange(turn === 'player' ? 'ai' : 'player');
        }, 1000);
      }
    }, 50);
  };

  // বোর্ড জেনারেট লজিক
  const renderBoard = () => {
    const cells = [];
    for (let r = 1; r <= 15; r++) {
      for (let c = 1; c <= 15; c++) {
        let className = "cell";
        let style: React.CSSProperties = { gridArea: `${r} / ${c} / ${r + 1} / ${c + 1}` };
        let content = null;

        // Top-Left Home (Player)
        if (r <= 6 && c <= 6) {
          if (r === 1 && c === 1) {
            className = "home-base gold";
            style.gridArea = "1 / 1 / 7 / 7";
            content = (
              <div className="home-inner">
                <div className="home-circle">{goldPawnSVG}</div>
                <div className="home-circle">{goldPawnSVG}</div>
                <div className="home-circle">{goldPawnSVG}</div>
                <div className="home-circle">{goldPawnSVG}</div>
              </div>
            );
          }
        }
        // Bottom-Right Home (AI)
        else if (r >= 10 && c >= 10) {
          if (r === 10 && c === 10) {
            className = "home-base red";
            style.gridArea = "10 / 10 / 16 / 16";
            content = (
              <div className="home-inner">
                <div className="home-circle">{redPawnSVG}</div>
                <div className="home-circle">{redPawnSVG}</div>
                <div className="home-circle">{redPawnSVG}</div>
                <div className="home-circle">{redPawnSVG}</div>
              </div>
            );
          }
        }
        // Top-Right Home (Empty)
        else if (r <= 6 && c >= 10) {
          if (r === 1 && c === 10) {
            className = "home-base gray";
            style.gridArea = "1 / 10 / 7 / 16";
            content = <div className="home-inner"><div className="home-circle"></div><div className="home-circle"></div><div className="home-circle"></div><div className="home-circle"></div></div>;
          }
        }
        // Bottom-Left Home (Empty)
        else if (r >= 10 && c <= 6) {
          if (r === 10 && c === 1) {
            className = "home-base gray";
            style.gridArea = "10 / 1 / 16 / 7";
            content = <div className="home-inner"><div className="home-circle"></div><div className="home-circle"></div><div className="home-circle"></div><div className="home-circle"></div></div>;
          }
        }
        // Center
        else if (r >= 7 && r <= 9 && c >= 7 && c <= 9) {
          if (r === 7 && c === 7) {
            className = "center-home";
            style.gridArea = "7 / 7 / 10 / 10";
            content = (
              <>
                <div className="center-triangle top"></div>
                <div className="center-triangle bottom"></div>
                <div className="center-triangle left"></div>
                <div className="center-triangle right"></div>
              </>
            );
          }
        }
        // Paths
        else {
          className += " path-white";
          // Gold Path
          if ((r === 8 && c >= 2 && c <= 6) || (c === 8 && r >= 2 && r <= 6)) {
            className = className.replace("path-white", "path-gold");
          }
          // Red Path
          else if ((r === 8 && c >= 10 && c <= 14) || (c === 8 && r >= 10 && r <= 14)) {
            className = className.replace("path-white", "path-red");
          }
          // Safe Zones
          if ((r === 7 && c === 2) || (r === 2 && c === 7) || (r === 14 && c === 9) || (r === 9 && c === 14)) {
            className += " safe";
          }
        }

        // ডেমো টোকেন প্লেসমেন্ট (পাথে)
        if (r === 8 && c === 3) content = goldPawnSVG;
        if (r === 4 && c === 8) content = redPawnSVG;

        cells.push(
          <div key={`${r}-${c}`} className={className} style={style}>
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="ludo-wrapper">
      <main className="game-container">
        
        {/* === TOP BAR (TRUST BUILDING) === */}
        <header className="top-bar">
          <div className="match-info">
            <span className="match-id">MATCH #{Math.floor(100000 + Math.random() * 900000)}</span>
            <span className="game-type">LUDO CLASSIC • 100 BDT</span>
          </div>

          <div className="player-vs-ai">
            {/* Player Profile */}
            <div className={`profile-card player-card ${turn === 'player' ? 'active-turn' : ''}`}>
              <div className="avatar-container">
                <div className="avatar player-av">👤</div>
                <div className="online-dot"></div>
              </div>
              <div className="profile-details">
                <div className="name-row">
                  <span className="player-name">You</span>
                  <span className="level-badge gold-badge">VIP 1</span>
                </div>
                <span className="balance">{playerBalance.toFixed(2)} BDT</span>
              </div>
            </div>

            {/* VS Badge & Timer */}
            <div className="vs-section">
              <div className="vs-badge">VS</div>
              <div className={`timer ${timeLeft <= 5 ? 'danger' : ''}`}>
                {timeLeft}s
              </div>
            </div>

            {/* AI Profile (Fake Real Player) */}
            <div className={`profile-card ai-card ${turn === 'ai' ? 'active-turn' : ''}`}>
              <div className="profile-details align-right">
                <div className="name-row">
                  <span className="level-badge red-badge">VIP 3</span>
                  <span className="player-name">Sabbir_99 🇧🇩</span>
                </div>
                <span className="balance">{aiBalance.toFixed(2)} BDT</span>
              </div>
              <div className="avatar-container">
                <div className="avatar ai-av">🧑‍💼</div>
                <div className="online-dot"></div>
              </div>
            </div>
          </div>
        </header>

        {/* === BOARD === */}
        <div className="board-wrapper">
          <div className="ludo-board">
            {renderBoard()}
          </div>
        </div>

        {/* === FOOTER / CONTROLS === */}
        <footer className="controls-area">
          <div className="turn-info">
            {turn === 'player' ? (
              <span className="text-gold">Your Turn</span>
            ) : (
              <span className="text-red">Sabbir is playing...</span>
            )}
          </div>

          <div className="dice-container">
            <div className={`dice ${isRolling ? 'rolling' : ''}`}>
              {[...Array(9)].map((_, i) => {
                // ডাইস ডট প্যাটার্ন
                const patterns: Record<number, number[]> = {
                  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
                };
                return <div key={i} className={`dot ${patterns[diceValue]?.includes(i) ? 'active' : ''}`} />;
              })}
            </div>
            
            <button 
              className={`roll-btn ${turn !== 'player' || isRolling ? 'disabled' : ''}`} 
              onClick={handleRoll}
              disabled={turn !== 'player' || isRolling}
            >
              {isRolling ? '...' : 'ROLL'}
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
}
