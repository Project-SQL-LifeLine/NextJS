"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../../../lib/supabase/client"; // পাথ চেক করে নিন
import "./ludu.css";

// ==========================================
// 1. BOARD CONSTANTS (Accurate 52-cell mapping)
// ==========================================
const TRACK = [
  [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7],
  [0,8], [1,8], [2,8], [3,8], [4,8], [5,8], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14],
  [8,14], [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7],
  [14,6], [13,6], [12,6], [11,6], [10,6], [9,6], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
  [7,0]
];

const HOME_LANES = {
  red: [[13,7], [12,7], [11,7], [10,7], [9,7], [8,7]],
  yellow: [[1,7], [2,7], [3,7], [4,7], [5,7], [6,7]],
};

const START_INDEX = { red: 39, yellow: 13 };
const SAFE_INDICES = [13, 21, 39, 46]; // Adjusted for 1v1 (start cells + some stars)

// Yard positions for 2 tokens each
const YARD_COORDS = {
  red: [[10,1], [13,4]], // Bottom-left corner
  yellow: [[1,10], [4,13]], // Top-right corner
};

const AI_NAMES = ["Sabbir_99", "Rakib_Hasan", "Mehedi_07", "Tanjim_Khan", "Arif_BD"];

type Color = 'red' | 'yellow';
type TokenStatus = 'yard' | 'track' | 'home_lane' | 'finished';

interface Token {
  id: string;
  color: Color;
  status: TokenStatus;
  trackIndex: number;
  homeLaneIndex: number;
}

export default function LudoMasterPage() {
  const t = (en: string, bn: string) => en;
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // Game State
  const [gamePhase, setGamePhase] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Color>('red');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [sixesCount, setSixesCount] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [animatingToken, setAnimatingToken] = useState<string | null>(null);
  
  // AI Name State
  const [aiName, setAiName] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    setAiName(AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
        if (data) setBalance(data.balance);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const initTokens = () => {
    // 2 tokens per player
    const newTokens: Token[] = [
      { id: `red-0`, color: 'red', status: 'yard', trackIndex: -1, homeLaneIndex: -1 },
      { id: `red-1`, color: 'red', status: 'yard', trackIndex: -1, homeLaneIndex: -1 },
      { id: `yellow-0`, color: 'yellow', status: 'yard', trackIndex: -1, homeLaneIndex: -1 },
      { id: `yellow-1`, color: 'yellow', status: 'yard', trackIndex: -1, homeLaneIndex: -1 },
    ];
    setTokens(newTokens);
  };

  // Turn Timer
  useEffect(() => {
    if (gamePhase !== 'playing' || isRolling || animatingToken || winner) return;
    
    if (timeLeft === 0) {
      nextTurn();
      return;
    }

    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, gamePhase, isRolling, animatingToken, winner]);

  // AI Logic
  useEffect(() => {
    if (gamePhase === 'playing' && currentTurn === 'yellow' && !winner && validMoves.length === 0 && !isRolling && !animatingToken) {
      const aiTimer = setTimeout(() => rollDice(), 1200);
      return () => clearTimeout(aiTimer);
    }
    
    if (gamePhase === 'playing' && currentTurn === 'yellow' && validMoves.length > 0 && !animatingToken) {
      const aiMoveTimer = setTimeout(() => {
        let bestMoveId = validMoves[0];
        const yardMoves = validMoves.filter(id => tokens.find(t => t.id === id)?.status === 'yard');
        if (yardMoves.length > 0) bestMoveId = yardMoves[0];
        executeMove(bestMoveId);
      }, 1200);
      return () => clearTimeout(aiMoveTimer);
    }
  }, [currentTurn, gamePhase, validMoves, isRolling, animatingToken, winner, tokens]);

  const rollDice = () => {
    if (isRolling || animatingToken || gamePhase !== 'playing' || winner) return;
    setIsRolling(true);
    
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRolling(false);
        handleDiceResult(finalDice);
      }
    }, 50);
  };

  const handleDiceResult = (dice: number) => {
    if (dice === 6) {
      setSixesCount(prev => prev + 1);
      if (sixesCount >= 2) {
        setTimeout(() => nextTurn(), 1000);
        return;
      }
    } else {
      setSixesCount(0);
    }

    const moves = getValidMoves(currentTurn, dice);
    setValidMoves(moves);

    if (moves.length === 0) {
      setTimeout(() => nextTurn(), 1200);
    }
  };

  const getValidMoves = (player: Color, dice: number): string[] => {
    const valid: string[] = [];
    const playerTokens = tokens.filter(t => t.color === player);

    playerTokens.forEach(token => {
      if (token.status === 'yard') {
        if (dice === 6) valid.push(token.id);
      } else if (token.status === 'track') {
        const dist = (token.trackIndex - START_INDEX[player] + 52) % 52;
        const nextDist = dist + dice;
        
        if (nextDist <= 51) valid.push(token.id); 
        else if (nextDist >= 52 && nextDist <= 57) valid.push(token.id);
      } else if (token.status === 'home_lane') {
        if (token.homeLaneIndex + dice <= 5) valid.push(token.id);
      }
    });

    return valid;
  };

  const executeMove = (tokenId: string) => {
    if (!validMoves.includes(tokenId)) return;
    setValidMoves([]);
    setAnimatingToken(tokenId);

    const token = tokens.find(t => t.id === tokenId)!;
    const player = token.color;
    const dice = diceValue;

    let newStatus = token.status;
    let newTrackIndex = token.trackIndex;
    let newHomeLaneIndex = token.homeLaneIndex;
    let isCapture = false;

    if (token.status === 'yard') {
      newStatus = 'track';
      newTrackIndex = START_INDEX[player];
    } else if (token.status === 'track') {
      const dist = (token.trackIndex - START_INDEX[player] + 52) % 52;
      const nextDist = dist + dice;
      
      if (nextDist <= 51) {
        newTrackIndex = (token.trackIndex + dice) % 52;
      } else {
        newStatus = 'home_lane';
        newHomeLaneIndex = nextDist - 52;
        newTrackIndex = -1;
      }
    } else if (token.status === 'home_lane') {
      newHomeLaneIndex += dice;
      if (newHomeLaneIndex >= 6) {
        newStatus = 'finished';
        newHomeLaneIndex = -1;
      }
    }

    // Capture logic
    let capturedTokenIds: string[] = [];
    if (newStatus === 'track') {
      const isSafe = SAFE_INDICES.includes(newTrackIndex);
      if (!isSafe) {
        tokens.forEach(t => {
          if (t.color !== player && t.status === 'track' && t.trackIndex === newTrackIndex) {
            capturedTokenIds.push(t.id);
          }
        });
      }
    }

    let updatedTokens = tokens.map(t => {
      if (t.id === tokenId) return { ...t, status: newStatus, trackIndex: newTrackIndex, homeLaneIndex: newHomeLaneIndex };
      if (capturedTokenIds.includes(t.id)) {
        isCapture = true;
        return { ...t, status: 'yard', trackIndex: -1, homeLaneIndex: -1 };
      }
      return t;
    });

    setTokens(updatedTokens as Token[]);

    setTimeout(() => {
      setAnimatingToken(null);
      
      // 2 Tokens win condition
      const playerTokens = updatedTokens.filter(t => t.color === player);
      if (playerTokens.every(t => t.status === 'finished')) {
        handleWin(player);
        return;
      }

      if (dice === 6 || isCapture) {
        setTimeLeft(15);
        setSixesCount(dice === 6 ? sixesCount : 0); 
      } else {
        nextTurn();
      }
    }, 300); // 300ms for animation
  };

  const nextTurn = () => {
    setSixesCount(0);
    setValidMoves([]);
    setTimeLeft(15);
    setCurrentTurn(prev => prev === 'red' ? 'yellow' : 'red');
  };

  const handleWin = async (winningPlayer: Color) => {
    setGamePhase('finished');
    setWinner(winningPlayer);
    
    if (winningPlayer === 'red') {
      const winAmount = betAmount * 1.9;
      try {
        const { data, error } = await supabase.rpc("finish_ludo_match", { p_bet_amount: betAmount, p_is_win: true });
        if (!error && data.success) setBalance(data.balance_after);
      } catch (err) { console.error(err); }
      alert(`🎉 You Won ${winAmount.toFixed(2)} BDT!`);
    } else {
      try {
        await supabase.rpc("finish_ludo_match", { p_bet_amount: betAmount, p_is_win: false });
      } catch (err) { console.error(err); }
      alert(`😢 ${aiName} Won the match! You lost.`);
    }
  };

  const startGame = async () => {
    if (betAmount > balance) return alert("Insufficient balance!");
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("start_ludo_match", { p_bet_amount: betAmount });
      if (error) throw error;
      if (data.success) {
        setBalance(data.balance_after);
        initTokens();
        setGamePhase('playing');
        setCurrentTurn('red');
        setWinner(null);
        setTimeLeft(15);
        setSixesCount(0);
      } else alert(data.error);
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  // Rendering Helpers
  const getTokenStyle = (token: Token) => {
    let r = 0, c = 0;
    let tokenSize = 6.5; 
    
    if (token.status === 'yard') {
      const idx = parseInt(token.id.split('-')[1]);
      [r, c] = YARD_COORDS[token.color][idx];
      tokenSize = 10;
    } else if (token.status === 'track') {
      [r, c] = TRACK[token.trackIndex];
    } else if (token.status === 'home_lane') {
      [r, c] = HOME_LANES[token.color][token.homeLaneIndex];
    } else if (token.status === 'finished') {
       r = 7; c = 7;
    }

    const cellSize = 100 / 15;
    return {
      position: 'absolute',
      width: `${tokenSize}%`,
      height: `${tokenSize}%`,
      top: `${(r + 0.5) * cellSize}%`,
      left: `${(c + 0.5) * cellSize}%`,
      transform: 'translate(-50%, -50%)',
      transition: animatingToken === token.id ? 'all 0.3s ease-in-out' : 'none',
      zIndex: token.status === 'track' ? 10 : 5,
      cursor: validMoves.includes(token.id) ? 'pointer' : 'default'
    } as React.CSSProperties;
  };

  const renderBoardCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip yards
        if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) continue;
        // Center block
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        const trackIdx = TRACK.findIndex(p => p[0] === r && p[1] === c);
        const isSafe = SAFE_INDICES.includes(trackIdx);

        let className = "cell ";
        
        if (trackIdx !== -1) {
          className += "track ";
          if (isSafe) className += "safe ";
          if (trackIdx === START_INDEX.red) className += "bg-red ";
          if (trackIdx === START_INDEX.yellow) className += "bg-yellow ";
        }

        if (HOME_LANES.red.some(p => p[0] === r && p[1] === c)) className += "lane-red ";
        if (HOME_LANES.yellow.some(p => p[0] === r && p[1] === c)) className += "lane-yellow ";

        cells.push(<div key={`${r}-${c}`} className={className} style={{ gridRow: r + 1, gridColumn: c + 1 }} />);
      }
    }
    return cells;
  }, []);

  const TokenSVG = ({ color }: { color: Color }) => {
    const colors: Record<Color, string> = { red: 'var(--red)', yellow: 'var(--yellow)' };
    return (
      <svg viewBox="0 0 64 70" style={{ width: '100%', height: '100%', display: 'block' }}>
        <path d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z" fill="white" stroke="#333" strokeWidth="3" />
        <circle cx="32" cy="27" r="14" fill={colors[color]} stroke="#333" strokeWidth="1" />
      </svg>
    );
  };

  if (loading) return <div className="ludo-wrapper" style={{ color: "white", display: "grid", placeItems: "center", height: "100vh" }}>Loading...</div>;

  return (
    <div className="ludo-wrapper">
      <div className="game">
        
        {/* TOP BAR */}
        <div className="wallet-header">
          <div className="wallet-box">
            <span className="wallet-label">YOU (RED)</span>
            <span className="wallet-amount">{balance.toFixed(2)} BDT</span>
          </div>
          
          <div className="match-status">
            {gamePhase === 'playing' && (
              <span className={`status-live ${currentTurn === 'red' ? 'text-red' : 'text-yellow'}`}>
                ● {currentTurn === 'red' ? "YOUR TURN" : `${aiName}'S TURN`} ({timeLeft}s)
              </span>
            )}
          </div>

          <div className="wallet-box ai-wallet">
            <span className="wallet-label">{aiName || "AI"}</span>
            <span className="wallet-amount">∞</span>
          </div>
        </div>

        {/* BOARD */}
        <div className="board-container">
          <div className="board">
            <div className="board-grid">
               {renderBoardCells}
            </div>
            
            {/* YARDS - only red and yellow have tokens now */}
            <div className="yard-wrapper top-left"><div className="yard yard-green"><div className="yard-inner"></div></div></div>
            <div className="yard-wrapper top-right"><div className="yard yard-yellow"><div className="yard-inner"></div></div></div>
            <div className="yard-wrapper bottom-left"><div className="yard yard-red"><div className="yard-inner"></div></div></div>
            <div className="yard-wrapper bottom-right"><div className="yard yard-blue"><div className="yard-inner"></div></div></div>

            {/* CENTER HOME */}
            <div className="center-home">
              <div className="tri top"></div>
              <div className="tri right"></div>
              <div className="tri bottom"></div>
              <div className="tri left"></div>
            </div>
            
            {/* TOKENS */}
            {tokens.map(token => {
              if (token.status === 'finished') return null;
              const style = getTokenStyle(token);
              return (
                <div 
                  key={token.id}
                  className={`token ${validMoves.includes(token.id) ? 'glow-move' : ''}`}
                  style={style}
                  onClick={() => validMoves.includes(token.id) && executeMove(token.id)}
                >
                  <TokenSVG color={token.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTROLS */}
        {gamePhase === 'betting' ? (
          <div className="betting-panel">
            <div className="bet-info">
              <span>Bet Amount (1v1 Match)</span>
              <div className="bet-controls">
                <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))}>-</button>
                <input type="number" value={betAmount} readOnly />
                <button onClick={() => setBetAmount(betAmount + 10)}>+</button>
              </div>
            </div>
            <button className="start-btn" onClick={startGame} disabled={isProcessing}>
              {isProcessing ? "STARTING..." : "START MATCH"}
            </button>
          </div>
        ) : (
          <div className="control bottom">
            <div className="panel">
              <button 
                className={`dice-button ${(currentTurn !== 'red' || isRolling || validMoves.length > 0) ? 'disabled-dice' : ''}`} 
                onClick={rollDice} 
                disabled={currentTurn !== 'red' || isRolling || validMoves.length > 0 || winner !== null}
              >
                <div className="dice-face">
                  {[...Array(9)].map((_, i) => {
                    const patterns: Record<number, number[]> = {
                      1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
                    };
                    return <div key={i} className={`dot ${patterns[diceValue]?.includes(i) ? 'active' : ''}`} />;
                  })}
                </div>
              </button>
            </div>
            <div style={{color:"white", fontSize:"14px", fontWeight:"bold", marginLeft:"15px"}}>
              {winner ? "GAME OVER" : currentTurn === 'red' ? "YOUR TURN" : `${aiName} TURN...`}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
