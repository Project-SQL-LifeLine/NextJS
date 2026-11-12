"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./dice.css";

export default function DiceGamePage() {
  const router = useRouter();

  // ডামি স্টেট (পরে Supabase এর সাথে কানেক্ট করবেন)
  const [balance, setBalance] = useState(4.75);
  const [betAmount, setBetAmount] = useState<number>(1.00);
  const [payout, setPayout] = useState<number>(2.00);
  const [result, setResult] = useState<number | null>(95.01);
  const [resultColor, setResultColor] = useState<string>("#19bd10");
  const [history, setHistory] = useState<{ val: number; win: boolean }[]>([
    { val: 95.01, win: true },
    { val: 44.33, win: false },
    { val: 55.33, win: false },
    { val: 85.45, win: true },
    { val: 19.17, win: true },
    { val: 49.00, win: false },
  ]);

  // লাইভ ম্যাথ ক্যালকুলেশন
  const chance = Math.min(97, 97 / payout);
  const otherChance = 100 - chance;
  const potentialWin = Math.max(0, betAmount) * payout;

  // বেট অ্যাডজাস্ট
  const adjustBet = (mode: "half" | "double" | "add") => {
    let newAmount = betAmount || 1;
    if (mode === "half") newAmount /= 2;
    if (mode === "double") newAmount *= 2;
    if (mode === "add") newAmount += 1;
    setBetAmount(Math.max(0.01, newAmount));
  };

  // ডাইস রোল লজিক (এখানে আপনার RPC ফাংশন কল হবে)
  const roll = (direction: "low" | "high") => {
    if (!betAmount || betAmount < 0.01) {
      alert("Enter a valid bet amount");
      return;
    }
    if (betAmount > balance) {
      alert("Insufficient demo balance");
      return;
    }

    const newBalance = balance - betAmount;
    const randomRoll = Math.random() * 100;
    const isWin = direction === "low" ? randomRoll < chance : randomRoll >= chance;

    setResult(randomRoll);
    setResultColor(isWin ? "#19bd10" : "#fff");

    if (isWin) {
      setBalance(newBalance + (betAmount * payout));
    } else {
      setBalance(newBalance);
    }

    // হিস্ট্রি আপডেট
    setHistory(prev => [{ val: randomRoll, win: isWin }, ...prev].slice(0, 6));
  };

  const resetDisplay = () => {
    setResult(50.00);
    setResultColor("#19bd10");
  };

  return (
    <div className="dice-game-wrapper">
      <div className="app">
        <div className="notch">▼</div>
        
        {/* টপ হিস্ট্রি বার */}
        <div className="historybar">
          {history.map((item, idx) => (
            <div key={idx} className={`history-item ${item.win ? "win" : ""}`}>
              {item.val.toFixed(2)}
            </div>
          ))}
          <button className="history-action" onClick={resetDisplay}>◴⌄</button>
        </div>

        <main>
          {/* রেজাল্ট ও গ্রাফ প্যানেল */}
          <section className="result-panel">
            <div className="result-number" style={{ color: resultColor }}>
              {result !== null ? result.toFixed(2) : "50.00"}
            </div>
            <div className="graph">
              <div className="tickrow"><i></i><i></i><i></i><i></i><i></i></div>
              <div className="bars first">
                <div className="segment red" style={{ width: `${chance}%` }}></div>
                <div className="segment blue" style={{ width: `${otherChance}%` }}></div>
              </div>
              <div className="bars">
                <div className="segment green" style={{ width: `${chance}%` }}></div>
                <div className="segment red" style={{ width: `${otherChance}%` }}></div>
              </div>
              <div className="indicator" style={{ left: `${chance}%` }}></div>
              <div className="scale-labels">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </section>

          {/* পেআউট সেকশন */}
          <section className="payout-panel">
            <div className="payout-top">
              <div className="payout-left">
                <div className="muted">Payout</div>
                <div className="multiplier">{payout.toFixed(2)} x</div>
              </div>
              <div className="slider-wrap">
                <input 
                  type="range" 
                  min="1.01" 
                  max="50" 
                  step=".01" 
                  value={payout} 
                  onChange={(e) => setPayout(Number(e.target.value))}
                />
                <span className="slider-symbol">‹›</span>
                <div className="slider-ticks">
                  {Array.from({ length: 30 }).map((_, i) => <i key={i}></i>)}
                </div>
              </div>
            </div>
            <div className="payout-bottom">
              <div>
                <span className="muted">Potential win:</span>
                <div>{potentialWin.toFixed(2)} BDT</div>
              </div>
              <div>
                <span className="muted">Chance:</span>
                <span>{chance.toFixed(2)} %</span>
              </div>
            </div>
          </section>

          {/* কন্ট্রোল সেকশন */}
          <section className="controls">
            <div className="play-row">
              <button className="circle" onClick={resetDisplay}>⟳</button>
              <button className="bet-button low" onClick={() => roll("low")}>
                ⌄<small>{chance.toFixed(2)}</small>
              </button>
              <button className="bet-button high" onClick={() => roll("high")}>
                ⌃<small>{otherChance.toFixed(2)}</small>
              </button>
            </div>
            <div className="bet-area">
              <div className="bet-input">
                <label>Bet BDT</label>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min=".01" 
                  step=".01" 
                />
              </div>
              <button className="small-btn" onClick={() => adjustBet("half")}>−</button>
              <button className="small-btn" onClick={() => adjustBet("double")}>▤</button>
              <button className="small-btn" onClick={() => adjustBet("add")}>+</button>
            </div>
          </section>
        </main>

        {/* ফুটার */}
        <footer className="footer">
          <div className="dice-label">DICE</div>
          <button className="help" onClick={() => alert("Dice demo UI")}>?</button>
          <div className="balance">{balance.toFixed(2)} <span>BDT</span></div>
          <button className="menu" onClick={() => router.push('/')}>☰</button>
        </footer>
      </div>
    </div>
  );
}
