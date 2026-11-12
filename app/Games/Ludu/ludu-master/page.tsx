
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../../../lib/supabase/client";
import "./ludu.css";

// ==========================================
// 1. BOARD CONSTANTS
// ==========================================

const TRACK: [number, number][] = [
  [6,1], [6,2], [6,3], [6,4], [6,5],
  [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7],
  [0,8], [1,8], [2,8], [3,8], [4,8], [5,8],
  [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14],
  [8,14], [8,13], [8,12], [8,11], [8,10], [8,9],
  [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7],
  [14,6], [13,6], [12,6], [11,6], [10,6], [9,6],
  [8,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
  [7,0]
];

const HOME_LANES: Record<Color, [number, number][]> = {
  red: [
    [13,7], [12,7], [11,7],
    [10,7], [9,7], [8,7]
  ],
  yellow: [
    [1,7], [2,7], [3,7],
    [4,7], [5,7], [6,7]
  ]
};

const START_INDEX: Record<Color, number> = {
  red: 39,
  yellow: 13
};

const SAFE_INDICES = [13, 21, 39, 46];

// Two perfectly aligned yard positions for each playing color
const YARD_COORDS: Record<Color, [number, number][]> = {
  red: [
    [10,2],
    [11,3]
  ],
  yellow: [
    [2,11],
    [3,12]
  ]
};

// ==========================================
// 2. OPPONENT NAME GENERATOR
// ==========================================

const AI_NAMES = [
  "SABBIR",
  "RAKIB",
  "TANVIR",
  "MEHEDI",
  "TANJIM",
  "ARIF",
  "SAKIB",
  "IMRAN",
  "NAYEM",
  "HASAN",
  "SHUVO",
  "RIYAD"
];

function generateOpponentName(seed: string): string {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);

  const name = AI_NAMES[positiveHash % AI_NAMES.length];

  // Stable number between 1 and 99999
  const number = (positiveHash % 99999) + 1;

  return `${name}${number}`;
}

// ==========================================
// 3. TYPES
// ==========================================

type Color = "red" | "yellow";

type TokenStatus =
  | "yard"
  | "track"
  | "home_lane"
  | "finished";

interface Token {
  id: string;
  color: Color;
  status: TokenStatus;
  trackIndex: number;
  homeLaneIndex: number;
}

type MoveStep = {
  status: TokenStatus;
  trackIndex: number;
  homeLaneIndex: number;
};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 4. MAIN GAME
// ==========================================

export default function LudoMasterPage() {

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // Game state
  const [gamePhase, setGamePhase] =
    useState<"betting" | "playing" | "finished">("betting");

  const [tokens, setTokens] = useState<Token[]>([]);

  const [currentTurn, setCurrentTurn] =
    useState<Color>("red");

  const [diceValue, setDiceValue] = useState(6);

  const [isRolling, setIsRolling] = useState(false);

  const [validMoves, setValidMoves] = useState<string[]>([]);

  const [sixesCount, setSixesCount] = useState(0);

  const [winner, setWinner] = useState<Color | null>(null);

  const [animatingToken, setAnimatingToken] =
    useState<string | null>(null);

  // Opponent
  const [aiName, setAiName] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================
  // 5. INITIALIZE USER
  // ==========================================

  useEffect(() => {

    let mounted = true;

    const fetchProfile = async () => {

      try {

        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!mounted) return;

        // Same account receives the same generated opponent name.
        const seed = user?.id ??
          `guest-${Date.now()}-${Math.random()}`;

        setAiName(generateOpponentName(seed));

        if (user) {

          const { data, error } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", user.id)
            .single();

          if (!error && data && mounted) {
            setBalance(Number(data.balance) || 0);
          }
        }

      } catch (error) {

        console.error("Profile loading error:", error);

      } finally {

        if (mounted) setLoading(false);

      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };

  }, []);

  // ==========================================
  // 6. INITIALIZE TOKENS
  // ==========================================

  const initTokens = () => {

    const newTokens: Token[] = [

      {
        id: "red-0",
        color: "red",
        status: "yard",
        trackIndex: -1,
        homeLaneIndex: -1
      },

      {
        id: "red-1",
        color: "red",
        status: "yard",
        trackIndex: -1,
        homeLaneIndex: -1
      },

      {
        id: "yellow-0",
        color: "yellow",
        status: "yard",
        trackIndex: -1,
        homeLaneIndex: -1
      },

      {
        id: "yellow-1",
        color: "yellow",
        status: "yard",
        trackIndex: -1,
        homeLaneIndex: -1
      }

    ];

    setTokens(newTokens);
  };

  // ==========================================
  // 7. TURN TIMER
  // ==========================================

  useEffect(() => {

    if (
      gamePhase !== "playing" ||
      isRolling ||
      animatingToken ||
      winner
    ) return;

    if (timeLeft <= 0) {
      nextTurn();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

  }, [
    timeLeft,
    gamePhase,
    isRolling,
    animatingToken,
    winner
  ]);

  // ==========================================
  // 8. VALID MOVE CALCULATOR
  // ==========================================

  const getValidMoves = (
    player: Color,
    dice: number
  ): string[] => {

    const valid: string[] = [];

    const playerTokens = tokens.filter(
      token => token.color === player
    );

    playerTokens.forEach(token => {

      if (token.status === "yard") {

        if (dice === 6) {
          valid.push(token.id);
        }

      } else if (token.status === "track") {

        const dist =
          (token.trackIndex - START_INDEX[player] + 52) % 52;

        const nextDist = dist + dice;

        if (nextDist <= 51) {
          valid.push(token.id);
        } else if (nextDist >= 52 && nextDist <= 57) {
          valid.push(token.id);
        }

      } else if (token.status === "home_lane") {

        if (token.homeLaneIndex + dice <= 5) {
          valid.push(token.id);
        }

      }

    });

    return valid;
  };

  // ==========================================
  // 9. DICE RESULT
  // ==========================================

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

  // ==========================================
  // 10. DICE ROLLING ANIMATION
  // ==========================================

  const rollDice = () => {

    if (
      isRolling ||
      animatingToken ||
      gamePhase !== "playing" ||
      winner
    ) return;

    setIsRolling(true);

    // The existing dice number remains unchanged
    // while the dice animation is running.

    setTimeout(() => {

      const finalDice =
        Math.floor(Math.random() * 6) + 1;

      setDiceValue(finalDice);

      setIsRolling(false);

      handleDiceResult(finalDice);

    }, 750);

  };

  // ==========================================
  // 11. STEP-BY-STEP TOKEN MOVEMENT
  // ==========================================

  const executeMove = async (tokenId: string) => {

    if (!validMoves.includes(tokenId)) return;

    const token = tokens.find(t => t.id === tokenId);

    if (!token) return;

    if (animatingToken || isRolling) return;

    setValidMoves([]);

    setAnimatingToken(tokenId);

    const player = token.color;

    const dice = diceValue;

    const steps: MoveStep[] = [];

    // ------------------------------------------
    // YARD TO RED/YELLOW START CELL
    // ------------------------------------------

    if (token.status === "yard") {

      steps.push({
        status: "track",
        trackIndex: START_INDEX[player],
        homeLaneIndex: -1
      });

    }

    // ------------------------------------------
    // MAIN TRACK MOVEMENT
    // ------------------------------------------

    else if (token.status === "track") {

      const dist =
        (token.trackIndex - START_INDEX[player] + 52) % 52;

      for (let i = 1; i <= dice; i++) {

        const nextDist = dist + i;

        if (nextDist <= 51) {

          steps.push({
            status: "track",
            trackIndex:
              (START_INDEX[player] + nextDist) % 52,
            homeLaneIndex: -1
          });

        } else {

          const homeIndex = nextDist - 52;

          if (homeIndex >= 0 && homeIndex <= 5) {

            steps.push({
              status: "home_lane",
              trackIndex: -1,
              homeLaneIndex: homeIndex
            });

          }

        }

      }

    }

    // ------------------------------------------
    // HOME LANE MOVEMENT
    // ------------------------------------------

    else if (token.status === "home_lane") {

      for (let i = 1; i <= dice; i++) {

        const nextIndex = token.homeLaneIndex + i;

        if (nextIndex >= 6) {

          steps.push({
            status: "finished",
            trackIndex: -1,
            homeLaneIndex: -1
          });

          break;

        }

        steps.push({
          status: "home_lane",
          trackIndex: -1,
          homeLaneIndex: nextIndex
        });

      }

    }

    if (steps.length === 0) {

      setAnimatingToken(null);

      return;
    }

    // ------------------------------------------
    // ANIMATE EACH CELL ONE BY ONE
    // ------------------------------------------

    let workingTokens = [...tokens];

    for (const step of steps) {

      await delay(160);

      workingTokens = workingTokens.map(t => {

        if (t.id === tokenId) {

          return {
            ...t,
            status: step.status,
            trackIndex: step.trackIndex,
            homeLaneIndex: step.homeLaneIndex
          };

        }

        return t;

      });

      setTokens([...workingTokens]);

    }

    // ------------------------------------------
    // CAPTURE LOGIC
    // ------------------------------------------

    const finalToken = workingTokens.find(
      t => t.id === tokenId
    );

    let isCapture = false;

    let capturedTokenIds: string[] = [];

    if (finalToken?.status === "track") {

      const isSafe = SAFE_INDICES.includes(
        finalToken.trackIndex
      );

      if (!isSafe) {

        workingTokens.forEach(t => {

          if (
            t.color !== player &&
            t.status === "track" &&
            t.trackIndex === finalToken.trackIndex
          ) {

            capturedTokenIds.push(t.id);

          }

        });

      }

    }

    if (capturedTokenIds.length > 0) {

      isCapture = true;

      workingTokens = workingTokens.map(t => {

        if (capturedTokenIds.includes(t.id)) {

          return {
            ...t,
            status: "yard",
            trackIndex: -1,
            homeLaneIndex: -1
          };

        }

        return t;

      });

    }

    setTokens(workingTokens);

    setAnimatingToken(null);

    // ------------------------------------------
    // WIN CONDITION
    // ------------------------------------------

    const playerTokens = workingTokens.filter(
      t => t.color === player
    );

    if (playerTokens.every(t => t.status === "finished")) {

      handleWin(player);

      return;
    }

    // ------------------------------------------
    // EXTRA TURN
    // ------------------------------------------

    if (dice === 6 || isCapture) {

      setTimeLeft(15);

      setSixesCount(dice === 6 ? sixesCount : 0);

    } else {

      nextTurn();

    }

  };

  // ==========================================
  // 12. NEXT TURN
  // ==========================================

  const nextTurn = () => {

    setSixesCount(0);

    setValidMoves([]);

    setTimeLeft(15);

    setCurrentTurn(prev =>
      prev === "red" ? "yellow" : "red"
    );

  };

  // ==========================================
  // 13. AI PLAYER
  // ==========================================

  useEffect(() => {

    if (
      gamePhase === "playing" &&
      currentTurn === "yellow" &&
      !winner &&
      validMoves.length === 0 &&
      !isRolling &&
      !animatingToken
    ) {

      const aiTimer = setTimeout(() => {
        rollDice();
      }, 1200);

      return () => clearTimeout(aiTimer);

    }

    if (
      gamePhase === "playing" &&
      currentTurn === "yellow" &&
      validMoves.length > 0 &&
      !animatingToken
    ) {

      const aiMoveTimer = setTimeout(() => {

        let bestMoveId = validMoves[0];

        const yardMoves = validMoves.filter(id =>
          tokens.find(t => t.id === id)?.status === "yard"
        );

        if (yardMoves.length > 0) {
          bestMoveId = yardMoves[0];
        }

        executeMove(bestMoveId);

      }, 1200);

      return () => clearTimeout(aiMoveTimer);

    }

  }, [
    currentTurn,
    gamePhase,
    validMoves,
    isRolling,
    animatingToken,
    winner,
    tokens
  ]);

  // ==========================================
  // 14. WIN HANDLER
  // ==========================================

  const handleWin = async (winningPlayer: Color) => {

    setGamePhase("finished");

    setWinner(winningPlayer);

    if (winningPlayer === "red") {

      const winAmount = betAmount * 1.9;

      try {

        const { data, error } = await supabase.rpc(
          "finish_ludo_match",
          {
            p_bet_amount: betAmount,
            p_is_win: true
          }
        );

        if (!error && data?.success) {

          setBalance(data.balance_after);

        }

      } catch (err) {

        console.error(err);

      }

      alert(
        `🎉 You Won ${winAmount.toFixed(2)} BDT!`
      );

    } else {

      try {

        await supabase.rpc(
          "finish_ludo_match",
          {
            p_bet_amount: betAmount,
            p_is_win: false
          }
        );

      } catch (err) {

        console.error(err);

      }

      alert(`😢 ${aiName} Won the match! You lost.`);

    }

  };

  // ==========================================
  // 15. START GAME
  // ==========================================

  const startGame = async () => {

    if (betAmount > balance) {

      return alert("Insufficient balance!");

    }

    setIsProcessing(true);

    try {

      const { data, error } = await supabase.rpc(
        "start_ludo_match",
        {
          p_bet_amount: betAmount
        }
      );

      if (error) throw error;

      if (data?.success) {

        setBalance(data.balance_after);

        initTokens();

        setGamePhase("playing");

        setCurrentTurn("red");

        setWinner(null);

        setTimeLeft(15);

        setSixesCount(0);

        setDiceValue(6);

        setValidMoves([]);

      } else {

        alert(data?.error || "Unable to start match.");

      }

    } catch (err: any) {

      alert(err.message || "Something went wrong.");

    } finally {

      setIsProcessing(false);

    }

  };

  // ==========================================
  // 16. TOKEN POSITION
  // ==========================================

  const getTokenStyle = (token: Token) => {

    let r = 0;
    let c = 0;

    let tokenSize = 6.5;

    if (token.status === "yard") {

      const idx = Number(token.id.split("-")[1]);

      [r, c] = YARD_COORDS[token.color][idx];

      // Round yard tokens
      tokenSize = 6.5;

    } else if (token.status === "track") {

      [r, c] = TRACK[token.trackIndex];

      tokenSize = 6.5;

    } else if (token.status === "home_lane") {

      [r, c] = HOME_LANES[token.color][token.homeLaneIndex];

      tokenSize = 6.5;

    } else {

      r = 7;
      c = 7;

    }

    const cellSize = 100 / 15;

    return {
      position: "absolute" as const,
      width: `${tokenSize}%`,
      height: `${tokenSize}%`,
      top: `${(r + 0.5) * cellSize}%`,
      left: `${(c + 0.5) * cellSize}%`,
      transform: "translate(-50%, -50%)",
      transition:
        animatingToken === token.id
          ? "top 0.14s linear, left 0.14s linear"
          : "none",
      zIndex: token.status === "track" ? 10 : 5,
      cursor: validMoves.includes(token.id)
        ? "pointer"
        : "default"
    } as React.CSSProperties;

  };

  // ==========================================
  // 17. BOARD CELLS
  // ==========================================

  const renderBoardCells = useMemo(() => {

    const cells = [];

    for (let r = 0; r < 15; r++) {

      for (let c = 0; c < 15; c++) {

        // Skip yards
        if (
          (r < 6 && c < 6) ||
          (r < 6 && c > 8) ||
          (r > 8 && c < 6) ||
          (r > 8 && c > 8)
        ) continue;

        // Skip center
        if (
          r >= 6 && r <= 8 &&
          c >= 6 && c <= 8
        ) continue;

        const trackIdx = TRACK.findIndex(
          p => p[0] === r && p[1] === c
        );

        const isSafe = SAFE_INDICES.includes(trackIdx);

        let className = "cell ";

        if (trackIdx !== -1) {

          className += "track ";

          if (isSafe) className += "safe ";

          if (trackIdx === START_INDEX.red) {
            className += "bg-red ";
          }

          if (trackIdx === START_INDEX.yellow) {
            className += "bg-yellow ";
          }

        }

        if (
          HOME_LANES.red.some(
            p => p[0] === r && p[1] === c
          )
        ) {
          className += "lane-red ";
        }

        if (
          HOME_LANES.yellow.some(
            p => p[0] === r && p[1] === c
          )
        ) {
          className += "lane-yellow ";
        }

        cells.push(
          <div
            key={`${r}-${c}`}
            className={className}
            style={{
              gridRow: r + 1,
              gridColumn: c + 1
            }}
          />
        );

      }

    }

    return cells;

  }, []);

  // ==========================================
  // 18. TOKEN GRAPHICS
  // ==========================================

  const TokenSVG = ({
    color,
    isYard
  }: {
    color: Color;
    isYard: boolean;
  }) => {

    const colors: Record<Color, string> = {
      red: "var(--red)",
      yellow: "var(--yellow)"
    };

    // Yard tokens are round pieces
    if (isYard) {

      return (
        <div
          className="yard-token-face"
          style={{
            background: colors[color]
          }}
        />
      );

    }

    // Track tokens retain pin design
    return (
      <svg
        viewBox="0 0 64 70"
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
      >

        <path
          d="M32 3 C16 3 5 14 5 28 C5 44 32 66 32 66 C32 66 59 44 59 28 C59 14 48 3 32 3Z"
          fill="white"
          stroke="#333"
          strokeWidth="3"
        />

        <circle
          cx="32"
          cy="27"
          r="14"
          fill={colors[color]}
          stroke="#333"
          strokeWidth="1"
        />

      </svg>
    );

  };

  // ==========================================
  // 19. LOADING
  // ==========================================

  if (loading) {

    return (
      <div
        className="ludo-wrapper"
        style={{
          color: "white",
          display: "grid",
          placeItems: "center"
        }}
      >
        Loading...
      </div>
    );

  }

  // ==========================================
  // 20. MAIN UI
  // ==========================================

  return (

    <div className="ludo-wrapper">

      <div className="game">

        {/* TOP WALLET */}

        <div className="wallet-header">

          <div className="wallet-box">

            <span className="wallet-label">
              YOU (RED)
            </span>

            <span className="wallet-amount">
              {balance.toFixed(2)} BDT
            </span>

          </div>

          <div className="match-status">

            {gamePhase === "playing" && (

              <span
                className={`status-live ${
                  currentTurn === "red"
                    ? "text-red"
                    : "text-yellow"
                }`}
              >

                ● {currentTurn === "red"
                  ? "YOUR TURN"
                  : `${aiName}'S TURN`
                } ({timeLeft}s)

              </span>

            )}

            {gamePhase === "finished" && (
              <span>GAME OVER</span>
            )}

          </div>

          <div className="wallet-box ai-wallet">

            <span className="wallet-label">
              {aiName || "AI"}
            </span>

            <span
              style={{
                fontSize: "9px",
                color: "#aaa",
                fontWeight: "bold"
              }}
            >
              AI OPPONENT
            </span>

            <span className="wallet-amount">
              ∞
            </span>

          </div>

        </div>

        {/* GAME BOARD */}

        <div className="board-container">

          <div className="board">

            <div className="board-grid">

              {renderBoardCells}

            </div>

            {/* GREEN YARD */}

            <div className="yard-wrapper top-left">

              <div className="yard yard-green">

                <div className="yard-inner" />

              </div>

            </div>

            {/* YELLOW YARD */}

            <div className="yard-wrapper top-right">

              <div className="yard yard-yellow">

                <div className="yard-inner" />

              </div>

            </div>

            {/* RED YARD */}

            <div className="yard-wrapper bottom-left">

              <div className="yard yard-red">

                <div className="yard-inner" />

              </div>

            </div>

            {/* BLUE YARD */}

            <div className="yard-wrapper bottom-right">

              <div className="yard yard-blue">

                <div className="yard-inner" />

              </div>

            </div>

            {/* CENTER HOME */}

            <div className="center-home">

              <div className="tri top" />

              <div className="tri right" />

              <div className="tri bottom" />

              <div className="tri left" />

            </div>

            {/* TOKENS */}

            {tokens.map(token => {

              if (token.status === "finished") {
                return null;
              }

              const style = getTokenStyle(token);

              return (

                <div
                  key={token.id}
                  className={`token ${
                    token.status === "yard" ? "yard-token" : ""
                  } ${
                    validMoves.includes(token.id)
                      ? "glow-move"
                      : ""
                  }`}
                  style={style}
                  onClick={() => {
                    if (validMoves.includes(token.id)) {
                      executeMove(token.id);
                    }
                  }}
                >

                  <TokenSVG
                    color={token.color}
                    isYard={token.status === "yard"}
                  />

                </div>

              );

            })}

          </div>

        </div>

        {/* BETTING PANEL */}

        {gamePhase === "betting" && (

          <div className="betting-panel">

            <div className="bet-info">

              <span>
                Bet Amount (1v1 Match)
              </span>

              <div className="bet-controls">

                <button
                  onClick={() =>
                    setBetAmount(Math.max(10, betAmount - 10))
                  }
                >
                  -
                </button>

                <input
                  type="number"
                  value={betAmount}
                  readOnly
                />

                <button
                  onClick={() =>
                    setBetAmount(betAmount + 10)
                  }
                >
                  +
                </button>

              </div>

            </div>

            <button
              className="start-btn"
              onClick={startGame}
              disabled={isProcessing}
            >

              {isProcessing
                ? "STARTING..."
                : "START MATCH"
              }

            </button>

          </div>

        )}

        {/* FIXED BOTTOM DICE BAR */}

        {gamePhase === "playing" && (

          <div className="control bottom">

            <div className="dice-status-bar">

              <button
                className={`dice-button ${
                  isRolling ? "rolling-dice" : ""
                } ${
                  currentTurn !== "red" ||
                  isRolling ||
                  validMoves.length > 0 ||
                  winner !== null
                    ? "disabled-dice"
                    : ""
                }`}
                onClick={rollDice}
                disabled={
                  currentTurn !== "red" ||
                  isRolling ||
                  validMoves.length > 0 ||
                  winner !== null
                }
              >

                <div className="dice-face">

                  {[...Array(9)].map((_, i) => {

                    const patterns: Record<number, number[]> = {

                      1: [4],

                      2: [0, 8],

                      3: [0, 4, 8],

                      4: [0, 2, 6, 8],

                      5: [0, 2, 4, 6, 8],

                      6: [0, 2, 3, 5, 6, 8]

                    };

                    return (

                      <div
                        key={i}
                        className={`dot ${
                          patterns[diceValue]?.includes(i)
                            ? "active"
                            : ""
                        }`}
                      />

                    );

                  })}

                </div>

              </button>

              <div className="turn-label">

                {winner
                  ? "GAME OVER"
                  : isRolling
                    ? "ROLLING..."
                    : currentTurn === "red"
                      ? "YOUR TURN"
                      : `${aiName} TURN...`
                }

              </div>

            </div>

          </div>

        )}

        {/* FINISHED MATCH */}

        {gamePhase === "finished" && (

          <div className="betting-panel">

            <button
              className="start-btn"
              onClick={() => {
                setGamePhase("betting");
                setWinner(null);
                setTokens([]);
                setValidMoves([]);
                setDiceValue(6);
                setTimeLeft(15);
              }}
            >
              PLAY AGAIN
            </button>

          </div>

        )}

      </div>

    </div>

  );

}
