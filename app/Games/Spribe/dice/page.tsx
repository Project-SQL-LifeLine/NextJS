"use client";

import { useState, useEffect } from "react";
import "./dice.css";

export default function DiceGamePage() {
  // স্টেট
  const [bet, setBet] = useState(1.00);
  const [chance, setChance] = useState(48.5);
  const [result, setResult] = useState("95.01");
  
  // হিস্ট্রি ডাটা (HTML এ হার্ডকোড ছিল, সেটাই রাখা হলো)
  const historyData = [
    { val: "95.01", isGreen: true },
    { val: "44.33", isGreen: false },
    { val: "55.33", isGreen: false },
    { val: "85.45", isGreen: true },
    { val: "19.17", isGreen: true },
    { val: "49", isGreen: false },
  ];

  // ক্যালকুলেশন
  const payout = 99 / chance;
  const highChance = 100 - chance;
  const potentialWin = bet * payout;

  // হ্যান্ডলার ফাংশনস
  const handleRoll = () => {
    const value = (Math.random() * 100).toFixed(2);
    setResult(value);
  };

  const handleLow = () => {
    const value = (Math.random() * chance).toFixed(2);
    setResult(value);
  };

  const handleHigh = () => {
    const value = (chance + Math.random() * (100 - chance)).toFixed(2);
    setResult(value);
  };

  return (
    <div className="dice-page-wrapper">
      <main className="game-shell">

        {/* HISTORY */}
        <section className="history">
          <div className="pointer"></div>
          {historyData.map((item, idx) => (
            <div key={idx} className={`history-item ${item.isGreen ? "green" : "white"}`}>
              {item.val}
            </div>
          ))}
          <button className="history-menu">◴⌄</button>
        </section>

        {/* RESULT PANEL */}
        <section className="result-panel">
          <div className="result-number" id="result">{result}</div>

          <div className="chart-area">
            <div className="scale">
              <i></i><i></i><i></i><i></i><i></i>
            </div>

            <div className="bars">
              <div className="bar bar-one">
                <div className="red"></div>
                <div className="cyan"></div>
              </div>
              <div className="bar bar-two">
                <div className="mint"></div>
                <div className="red"></div>
              </div>
            </div>

            <div className="ball"></div>

            <div className="axis">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </section>

        {/* PAYOUT */}
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
            <button className="action-btn roll" id="roll" onClick={handleRoll}>
              ⟳
              <span style={{ fontSize: '25px', position: 'absolute' }}>▶</span>
            </button>

            <button className="action-btn low" id="low" onClick={handleLow}>
              <span className="arrow">⌄</span>
              <span className="prob" id="lowChance">{chance.toFixed(2)}</span>
            </button>

            <button className="action-btn high" id="high" onClick={handleHigh}>
              <span className="arrow">⌃</span>
              <span className="prob" id="highChance">{highChance.toFixed(2)}</span>
            </button>
          </div>

          <div className="bet-row">
            <div>
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
            4.75 <span>BDT</span>
          </div>
          <button className="menu">☰</button>
        </footer>

      </main>
    </div>
  );
}
