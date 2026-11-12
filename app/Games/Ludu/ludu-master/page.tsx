"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../../../lib/supabase/client"; // পাথ চেক করে নিন
import "./ludu.css";

// ==========================================
// 1. BOARD CONSTANTS & MAPS
// ==========================================
const MAIN_TRACK = [
  [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7], [0,8], [0,9], [1,9], [2,9], [3,9], [4,9], [5,9], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14], [8,14], [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7], [14,6], [13,6], [12,6], [11,6], [10,6], [9,6], [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], [7,1]
];

const HOME_LANES = {
  red: [[7,1], [7,2], [7,3], [7,4], [7,5], [7,6]],
  green: [[1,7], [2,7], [3,7], [4,7], [5,7], [6,7]],
  yellow: [[7,13], [7,12], [7,11], [7,10], [7,9], [7,8]],
  blue: [[13,7], [12,7], [11,7], [10,7], [9,7], [8,7]]
};

const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// ==========================================
// 2. TYPES
// ==========================================
type Color = 'red' | 'green' | 'yellow' | 'blue';
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
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [sixesCount, setSixesCount] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  
  // Animation State
  const [animatingToken, setAnimatingToken] = useState<string | null>(null);
  
  // Timer for turns (15 seconds)
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Tokens
  const initTokens = () => {
    const newTokens: Token[] = [];
    (['red', 'green', 'yellow', 'blue'] as Color[]).forEach(color => {
      for (let i = 0; i < 4; i++) {
        newTokens.push({
          id: `${color}-${i}`,
          color,
          status: 'yard',
          trackIndex: -1,
          homeLaneIndex: -1
        });
      }
    });
    setTokens(newTokens);
  };

  // Fetch Profile
  useEffect(() => {
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

  // Timer Logic
  useEffect(() => {
    if (gamePhase !== 'playing' || isRolling || animatingToken || winner) return;
    
    if (timeLeft === 0) {
      // Auto skip turn if timeout
      nextTurn();
      return;
    }

    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, gamePhase, isRolling, animatingToken, winner]);

  // AI Logic
  useEffect(() => {
    if (gamePhase === 'playing' && currentTurn !== 'red' && !winner && validMoves.length === 0 && !isRolling && !animatingToken) {
      // AI turn: wait a bit then roll
      const aiTimer = setTimeout(() => {
        rollDice();
      }, 1500);
      return () => clearTimeout(aiTimer);
    }
    
    if (gamePhase === 'playing' && currentTurn !== 'red' && validMoves.length > 0 && !animatingToken) {
      // AI has valid moves, pick one
      const aiMoveTimer = setTimeout(() => {
        // Basic AI: Prioritize capturing, then moving out of yard, then furthest token
        let bestMoveId = validMoves[0];
        // (Simplified logic for brevity, can be expanded)
        executeMove(bestMoveId);
      }, 1500);
      return () => clearTimeout(aiMoveTimer);
    }
  }, [currentTurn, gamePhase, validMoves, isRolling, animatingToken, winner]);


  // ==========================================
  // 3. GAME MECHANICS
  // ==========================================

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
        // 3 consecutive sixes -> skip turn
        setTimeout(() => nextTurn(), 1000);
        return;
      }
    } else {
      setSixesCount(0);
    }

    const moves = getValidMoves(currentTurn, dice);
    setValidMoves(moves);

    if (moves.length === 0) {
      // No valid moves, pass turn after 1.5s
      setTimeout(() => nextTurn(), 1500);
    }
  };

  const getValidMoves = (player: Color, dice: number): string[] => {
    const valid: string[] = [];
    const playerTokens = tokens.filter(t => t.color === player);

    playerTokens.forEach(token => {
      if (token.status === 'yard') {
        if (dice === 6) {
          // Check if start cell has own blockade (optional rule)
          valid.push(token.id);
        }
      } else if (token.status === 'track') {
        const dist = (token.trackIndex - START_INDEX[player] + 52) % 52;
        const nextDist = dist + dice;
        
        if (nextDist <= 51) {
          valid.push(token.id); // Normal track move
        } else if (nextDist >= 52 && nextDist <= 57) {
          valid.push(token.id); // Enter home lane
        }
        // If nextDist > 57, overshoot, invalid.
      } else if (token.status === 'home_lane') {
        if (token.homeLaneIndex + dice <= 5) {
          valid.push(token.id);
        }
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

    // Calculate new position
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
      if (newHomeLaneIndex === 6) { // Wait, lanes are 0-5. 5 is the last cell. 
        // Actually, exact roll needed to go from 5 to "finished".
        // If they are at 5, and roll 1, they finish.
        // Let's refine: home lane has 6 cells. Index 0-5.
      }
    }

    // Actually, exact finish logic:
    // If newHomeLaneIndex >= 6, they are finished.
    if (newStatus === 'home_lane' && newHomeLaneIndex >= 6) {
      newStatus = 'finished';
      newHomeLaneIndex = -1;
    }

    // Check for capture (only on track)
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

    // Update states
    let updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return { ...t, status: newStatus, trackIndex: newTrackIndex, homeLaneIndex: newHomeLaneIndex };
      }
      // Send captured tokens back to yard
      if (capturedTokenIds.includes(t.id)) {
        isCapture = true;
        return { ...t, status: 'yard', trackIndex: -1, homeLaneIndex: -1 };
      }
      return t;
    });

    setTokens(updatedTokens as Token[]);

    // Animation duration (e.g., 400ms per cell, max 1.5s)
    setTimeout(() => {
      setAnimatingToken(null);
      
      // Check Win condition
      const playerTokens = updatedTokens.filter(t => t.color === player);
      if (playerTokens.every(t => t.status === 'finished')) {
        handleWin(player);
        return;
      }

      // Turn management: Extra turn on 6 or Capture
      if (dice === 6 || isCapture) {
        // Player gets another turn
        setTimeLeft(15);
        setSixesCount(dice === 6 ? sixesCount : 0); 
      } else {
        nextTurn();
      }
    }, 600);
  };

  const nextTurn = () => {
    setSixesCount(0);
    setValidMoves([]);
    setTimeLeft(15);
    const colors: Color[] = ['red', 'green', 'yellow', 'blue'];
    const currentIndex = colors.indexOf(currentTurn);
    setCurrentTurn(colors[(currentIndex + 1) % 4]);
  };

  const handleWin = async (winningPlayer: Color) => {
    setGamePhase('finished');
    setWinner(winningPlayer);
    
    if (winningPlayer === 'red') {
      const winAmount = betAmount * 1.9;
      try {
        const { data, error } = await supabase.rpc("finish_ludo_match", {
          p_bet_amount: betAmount, p_is_win: true
        });
        if (!error && data.success) setBalance(data.balance_after);
      } catch (err) { console.error(err); }
      alert(`🎉 You Won ${winAmount.toFixed(2)} BDT!`);
    } else {
      try {
        await supabase.rpc("finish_ludo_match", {
          p_bet_amount: betAmount, p_is_win: false
        });
      } catch (err) { console.error(err); }
      alert(`😢 ${winningPlayer.toUpperCase()} Won the match! You lost.`);
    }
  };

  // Start Game
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


  // ==========================================
  // 4. RENDERING HELPERS
  // ==========================================
  const getTokenPosition = (token: Token) => {
    if (token.status === 'yard') {
      // Render in the yard corners based on index
      const idx = parseInt(token.id.split('-')[1]);
      const offsets = [[-15,-15], [15,-15], [-15,15], [15,15]]; // Offsets for 4 tokens
      return { 
        transform: `translate(${offsets[idx][0]}px, ${offsets[idx][1]}px)`,
        opacity: 1
      };
    }
    if (token.status === 'finished') {
       return { opacity: 0 }; // Hide finished tokens or render in center
    }

    let [r, c] = [0, 0];
    if (token.status === 'track') {
      [r, c] = MAIN_TRACK[token.trackIndex];
    } else if (token.status === 'home_lane') {
      [r, c] = HOME_LANES[token.color][token.homeLaneIndex];
    }

    // Calculate % position within the 15x15 board
    const cellSize = 100 / 15;
    return {
      top: `${(r + 0.5) * cellSize}%`,
      left: `${(c + 0.5) * cellSize}%`,
      transform: 'translate(-50%, -50%)',
      transition: animatingToken === token.id ? 'all 0.4s ease-in-out' : 'none',
      opacity: 1
    };
  };

  const renderBoardCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        let className = "cell ";
        // Color styling based on coordinates
        if (r >= 0 && r <= 5 && c >= 0 && c <= 5) className += "yard-green ";
        else if (r >= 0 && r <= 5 && c >= 9 && c <= 14) className += "yard-yellow ";
        else if (r >= 9 && r <= 14 && c >= 0 && c <= 5) className += "yard-red ";
        else if (r >= 9 && r <= 14 && c >= 9 && c <= 14) className += "yard-blue ";
        else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) className += "center-home ";
        else {
           // Tracks
           const trackIdx = MAIN_TRACK.findIndex(p => p[0] === r && p[1] === c);
           if (trackIdx !== -1) {
             className += "track ";
             if (SAFE_INDICES.includes(trackIdx)) className += "safe ";
             if (r === 7 && c === 1) className += "lane-red "; // red start arrow
           } else {
             className += "path-cell ";
           }
        }
        
        cells.push(<div key={`${r}-${c}`} className={className} style={{ gridRow: r + 1, gridColumn: c + 1 }} />);
      }
    }
    return cells;
  }, []);

  const TokenSVG = ({ color }: { color: Color }) => {
    const colors: Record<Color, string> = { red: 'var(--red)', green: 'var(--green)', yellow: 'var(--yellow)', blue: 'var(--blue)' };
    return (
      <svg viewBox="0 0 64 70" className="token-svg">
        <path d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z" fill="white" stroke="#555" strokeWidth="2" />
        <circle cx="32" cy="27" r="14" fill={colors[color]} stroke="#555" strokeWidth="1" />
      </svg>
    );
  };

  if (loading) return <div className="ludo-wrapper" style={{ color: "white", display: "grid", placeItems: "center", height: "100vh" }}>Loading...</div>;

  return (
    <div className="ludo-wrapper">
      <div className="game">
        
        {/* TOP BAR (Game Info) */}
        <div className="wallet-header">
          <div className="wallet-box">
            <span className="wallet-label">BALANCE</span>
            <span className="wallet-amount">{balance.toFixed(2)} BDT</span>
          </div>
          <div className="match-status">
            {gamePhase === 'playing' && <span className="status-live">● {currentTurn.toUpperCase()} TURN ({timeLeft}s)</span>}
          </div>
          <div className="wallet-box ai-wallet">
            <span className="wallet-label">OPPONENTS</span>
            <span className="wallet-amount">3 AI</span>
          </div>
        </div>

        {/* BOARD */}
        <div className="board">
          <div className="board-grid">
             {renderBoardCells}
          </div>
          
          {/* Render Tokens absolutely over the board */}
          {tokens.map(token => {
            const pos = getTokenPosition(token);
            if (pos.opacity === 0) return null;
            
            return (
              <div 
                key={token.id}
                className={`token ${validMoves.includes(token.id) ? 'glow-move' : ''}`}
                style={{ 
                  position: 'absolute', 
                  width: '5.5%', 
                  height: 'auto', 
                  zIndex: token.status === 'track' ? 10 : 5,
                  ...pos
                }}
                onClick={() => validMoves.includes(token.id) && executeMove(token.id)}
              >
                <TokenSVG color={token.color} />
              </div>
            );
          })}
        </div>

        {/* CONTROLS */}
        {gamePhase === 'betting' ? (
          <div className="betting-panel">
            <div className="bet-info">
              <span>Bet Amount</span>
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
              {/* Dice display and Roll button */}
              <button 
                className={`dice-button ${(currentTurn !== 'red' || isRolling || validMoves.length > 0) ? 'disabled-dice' : ''}`} 
                onClick={rollDice} 
                disabled={currentTurn !== 'red' || isRolling || validMoves.length > 0 || winner !== null}
              >
                <div className="dice-face" style={{ background: dicePatterns[diceValue] }}></div>
              </button>
            </div>
            <div style={{color:"white", fontSize:"12px", marginLeft:"10px"}}>
              {winner ? "GAME OVER" : currentTurn === 'red' ? "YOUR TURN" : "AI TURN..."}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
