"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ চেক করে নিন
import "./ludu.css";

// 🗺️ লুডু বোর্ডের ৫২ ধাপের রিয়েল পাথ (Row, Col)
// Red Player শুরু করবে 0 থেকে (8,2), Yellow Player শুরু করবে 15 থেকে (2,7)
const GLOBAL_PATH = [
  [8,2], [8,1], [7,1], [6,1], [5,1], [4,1], [3,1], [2,1], [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], // 0-14
  [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [7,8], [7,9], [7,10], [7,11], [7,12], [7,13], [7,14], [8,14], [9,14], // 15-29
  [10,14], [11,14], [12,14], [13,14], [14,14], [15,14], [15,13], [15,12], [15,11], [15,10], [15,9], [15,8], [15,7], [14,7], [13,7], [12,7], [11,7], [10,7], [9,7], [8,7], [8,6], [8,5], [8,4], [8,3] // 30-53
];

type Token = {
  id: string;
  player: 'red' | 'yellow';
  status: 'base' | 'path' | 'home';
  pos: number; // -1 মানে বেসে আছে, 0-52 মানে পাথে আছে
};

export default function LudoMasterPage() {
  const t = (en: string, bn: string) => en;
  const router = useRouter();

  // 💰 ক্যাসিনো স্টেটস
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🎮 গেম স্টেটস
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [tokens, setTokens] = useState<Token[]>([
    { id: 'r1', player: 'red', status: 'base', pos: -1 },
    { id: 'r2', player: 'red', status: 'base', pos: -1 },
    { id: 'y1', player: 'yellow', status: 'base', pos: -1 },
    { id: 'y2', player: 'yellow', status: 'base', pos: -1 },
  ]);
  const [turn, setTurn] = useState<'red' | 'yellow'>('red');
  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  // ১. ইউজারের রিয়েল ব্যালেন্স লোড
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

  // 🚀 গেম শুরু
  const startGame = async () => {
    if (betAmount > balance) return alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("start_ludo_match", { p_bet_amount: betAmount });
      if (error) throw error;
      if (data.success) {
        setBalance(data.balance_after);
        setGameState('playing');
        setTokens([
          { id: 'r1', player: 'red', status: 'base', pos: -1 },
          { id: 'r2', player: 'red', status: 'base', pos: -1 },
          { id: 'y1', player: 'yellow', status: 'base', pos: -1 },
          { id: 'y2', player: 'yellow', status: 'base', pos: -1 },
        ]);
        setTurn('red');
      } else alert(data.error);
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  // 🎲 ডাইস রোল
  const rollDice = () => {
    if (isRolling || gameState !== 'playing') return;
    setIsRolling(true);
    
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        setIsRolling(false);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceVal(finalDice);
        calculateValidMoves(finalDice);
      }
    }, 50);
  };

  // 🔍 ভ্যালিড মুভ ক্যালকুলেশন
  const calculateValidMoves = (dice: number) => {
    const moves: string[] = [];
    const currentTokens = tokens.filter(t => t.player === turn);

    currentTokens.forEach(t => {
      if (t.status === 'base' && dice === 6) {
        moves.push(t.id); // ৬ পড়লে বেস থেকে বের হবে
      } else if (t.status === 'path') {
        const startIdx = t.player === 'red' ? 0 : 15;
        const nextPos = t.pos + dice;
        if (nextPos <= 52) moves.push(t.id); // পাথের বাইরে যাবে না
      }
    });

    setValidMoves(moves);

    // যদি কোনো মুভ না থাকে, তবে ১ সেকেন্ড পর টার্ন চেঞ্জ হবে
    if (moves.length === 0) {
      setTimeout(() => switchTurn(), 1000);
    }
  };

  // 🚶‍♂️ টোকেন মুভ
  const moveToken = (tokenId: string) => {
    if (!validMoves.includes(tokenId)) return;

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        if (t.status === 'base') return { ...t, status: 'path', pos: 0 }; // বেস থেকে বের হবে
        const nextPos = t.pos + diceVal;
        return { ...t, pos: nextPos, status: nextPos === 52 ? 'home' : 'path' };
      }
      return t;
    }));
    
    setValidMoves([]);
    if (diceVal !== 6) switchTurn(); // ৬ না পড়লে টার্ন চেঞ্জ
  };

  const switchTurn = () => {
    setTurn(prev => prev === 'red' ? 'yellow' : 'red');
    setDiceVal(1);
    setValidMoves([]);
  };

  // 🤖 এআই লজিক (অটোমেটিক রোল ও মুভ)
  useEffect(() => {
    if (turn === 'yellow' && gameState === 'playing' && !isRolling) {
      const timer = setTimeout(() => rollDice(), 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, isRolling]);

  useEffect(() => {
    if (turn === 'yellow' && validMoves.length > 0) {
      const timer = setTimeout(() => {
        // এআই র‍্যান্ডম মুভ সিলেক্ট করবে (ভবিষ্যতে স্মার্ট এআই করা যাবে)
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        moveToken(randomMove);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [validMoves, turn]);

  // 🏆 গেম ফিনিশ (ডেমো)
  const finishGame = async (isWin: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("finish_ludo_match", {
        p_bet_amount: betAmount, p_is_win: isWin
      });
      if (error) throw error;
      if (data.success) {
        setBalance(data.balance_after);
        setGameState('betting');
        alert(isWin ? "You Won!" : "You Lost!");
      }
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  // 📍 টোকেনের পজিশন ক্যালকুলেট করা (গ্রিড অনুযায়ী)
  const getTokenStyle = (token: Token) => {
    if (token.status === 'base') {
      if (token.player === 'red') {
        return { bottom: token.id === 'r1' ? '12%' : '22%', left: token.id === 'r1' ? '12%' : '22%', transform: 'translate(0, 0)' };
      } else {
        return { top: token.id === 'y1' ? '12%' : '22%', right: token.id === 'y1' ? '12%' : '22%', transform: 'translate(0, 0)' };
      }
    } else {
      const startIdx = token.player === 'red' ? 0 : 15;
      const pathIdx = (startIdx + token.pos) % GLOBAL_PATH.length;
      const [r, c] = GLOBAL_PATH[pathIdx];
      const cellSize = 100 / 15;
      return {
        top: `calc(${(r - 0.5) * cellSize}%)`,
        left: `calc(${(c - 0.5) * cellSize}%)`,
        transform: 'translate(-50%, -50%)'
      };
    }
  };

  // বোর্ড গ্রিড
  const gridCells = useMemo(() => {
    const cells = [];
    for (let r = 1; r <= 15; r++) {
      for (let c = 1; c <= 15; c++) {
        let active = (c >= 7 && c <= 9 && (r <= 6 || r >= 10)) || (r >= 7 && r <= 9 && (c <= 6 || c >= 10));
        if (!active) continue;
        let className = "cell";
        if (r >= 2 && r <= 6 && c === 8) className += " yellow-lane";
        if (r >= 10 && r <= 14 && c === 8) className += " red-lane";
        if (r === 8 && c >= 2 && c <= 6) className += " green-lane";
        if (r === 8 && c >= 10 && c <= 14) className += " blue-lane";
        
        cells.push(<div key={`${r}-${c}`} className={className} style={{ gridRow: r, gridColumn: c }} />);
      }
    }
    return cells;
  }, []);

  const TokenSVG = ({ color }: { color: string }) => (
    <svg viewBox="0 0 64 70"><path d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z" fill="white" stroke="#777" strokeWidth="3" /><circle cx="32" cy="27" r="14" fill={color} stroke="#777" strokeWidth="2" /></svg>
  );

  if (loading) return <div className="ludo-wrapper" style={{color:"white", display:"flex", alignItems:"center", justifyContent:"center", height:"100vh"}}>Loading...</div>;

  return (
    <div className="ludo-wrapper">
      <div className="game">
        
        {/* ওয়ালেট হেডার */}
        <div className="wallet-header">
          <div className="wallet-box">
            <span className="wallet-label">{t("Balance", "ব্যালেন্স")}</span>
            <span className="wallet-amount">{Number(balance).toFixed(2)} BDT</span>
          </div>
          <div className="match-status">
            {gameState === 'playing' ? <span className="status-live">● {turn === 'red' ? "YOUR TURN" : "AI TURN"}</span> : <span className="status-idle">{t("READY TO PLAY", "খেলতে প্রস্তুত")}</span>}
          </div>
          <div className="wallet-box ai-wallet">
            <span className="wallet-label">{t("Opponent", "প্রতিপক্ষ")}</span>
            <span className="wallet-amount">∞</span>
          </div>
        </div>

        {/* TOP PLAYER (Yellow / AI) */}
        <div className="control top">
          <div className="panel">
            <div className="player-box" style={{opacity: turn === 'yellow' ? 1 : 0.5}}>
              <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}><TokenSVG color="var(--yellow)" /></div>
            </div>
            <button className={`dice-button ${(!isRolling && turn === 'yellow' && validMoves.length===0) ? '' : 'disabled-dice'}`} disabled={turn !== 'yellow'}>
              <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
            </button>
          </div>
        </div>

        {/* BOARD */}
        <div className="board">
          <div className="board-grid">{gridCells}</div>
          
          {/* Homes */}
          <div className="home green"><div className="home-inner"><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div></div></div>
          <div className="home yellow"><div className="home-inner"><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div></div><div className="player-name">Player 2</div></div>
          <div className="home red"><div className="home-inner"><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div></div><div className="player-name">Player 1</div></div>
          <div className="home blue"><div className="home-inner"><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div><div className="home-dot"></div></div></div>

          <div className="center">
            <div className="triangle yellow"></div><div className="triangle blue"></div><div className="triangle red"></div><div className="triangle green"></div>
          </div>

          {/* 🎯 DYNAMIC TOKENS */}
          {tokens.map(token => (
            <div 
              key={token.id} 
              className={`token ${validMoves.includes(token.id) ? 'glow-move' : ''}`}
              style={{ ...getTokenStyle(token), transition: 'all 0.4s ease-out' }}
              onClick={() => moveToken(token.id)}
            >
              <TokenSVG color={token.player === 'red' ? 'var(--red)' : 'var(--yellow)'} />
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        {gameState === 'betting' ? (
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
                <button key={amt} onClick={() => setBetAmount(amt)} className={betAmount === amt ? 'active' : ''}>{amt}</button>
              ))}
            </div>
            <button className="start-btn" onClick={startGame} disabled={isProcessing}>
              {isProcessing ? t("STARTING...", "শুরু হচ্ছে...") : t("START MATCH", "ম্যাচ শুরু করুন")}
            </button>
          </div>
        ) : (
          <div className="control bottom">
            <div className="panel">
              <div className="player-box" style={{opacity: turn === 'red' ? 1 : 0.5}}>
                <div className="token" style={{ position: "relative", width: "40px", height: "48px" }}><TokenSVG color="var(--red)" /></div>
              </div>
              <button className={`dice-button ${(turn === 'red' && !isRolling && validMoves.length===0) ? '' : 'disabled-dice'}`} onClick={rollDice} disabled={turn !== 'red' || isRolling || validMoves.length > 0}>
                <div className="dice-face" style={{ background: dicePatterns[diceVal] }}></div>
              </button>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:"5px", marginLeft:"auto", marginRight:"3%"}}>
                <button className="finish-demo-btn" style={{background:"#00e701", margin:0}} onClick={() => finishGame(true)} disabled={isProcessing}>Win</button>
                <button className="finish-demo-btn" style={{background:"#ff4d4d", margin:0}} onClick={() => finishGame(false)} disabled={isProcessing}>Lose</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
