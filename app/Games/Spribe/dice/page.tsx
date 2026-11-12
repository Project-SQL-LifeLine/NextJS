"use client";

import { useState } from "react";
import "./dice.css";

export default function DiceGamePage() {
  const [bet, setBet] = useState(1.00);
  const [chance, setChance] = useState(48.5);
  const [result, setResult] = useState(95.01);
  const [isRolling, setIsRolling] = useState(false);
  const [isWin, setIsWin] = useState<boolean | null>(null);

  const [historyData, setHistoryData] = useState([
    { val: "95.01", isGreen: true },
    { val: "44.33", isGreen: false },
    { val: "55.33", isGreen: false },
    { val: "85.45", isGreen: true },
    { val: "19.17", isGreen: true },
    { val: "49", isGreen: false },
  ]);

  const payout = 99 / chance;
  const highChance = 100 - chance;
  const potentialWin = bet * payout;

  const handleRoll = (isHigh: boolean) => {
    if (isRolling) return;

    setIsRolling(true);
    setIsWin(null);

    let rollCount = 0;
    const duration = 1000;
    const intervalTime = 50; 

    const interval = setInterval(() => {
      const animResult = Math.random() * 100;
      setResult(Number(animResult.toFixed(2)));
      rollCount++;

      if (rollCount * intervalTime >= duration) {
        clearInterval(interval);
        
        const finalResult = Math.random() * 100;
        setResult(Number(finalResult.toFixed(2)));
        setIsRolling(false);

        const win = isHigh ? finalResult >= chance : finalResult < chance;
        setIsWin(win);

        setHistoryData(prev => [
          { val: finalResult.toFixed(2), isGreen: win },
          ...prev
        ].slice(0, 6));
      }
    }, intervalTime);
  };

  const handleMainRollClick = () => {
    handleRoll(false); // ডিফল্ট Under
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

        {/* RESULT & GRAPH PANEL */}
        <section className="result-panel">
          <div 
            className="result-number" 
            id="result"
            style={{ color: isWin === true ? "#36bd00" : isWin === false ? "#ff4d4d" : "#36bd00" }}
          >
            {result.toFixed(2)}
          </div>

          <div className="chart-area">
            <div className="scale">
              <i></i><i></i><i></i><i></i><i></i>
            </div>

            <div className="bars">
              <div className="bar bar-one">
                <div className="red" style={{ width: `${100 - chance}%` }}></div>
                <div className="cyan" style={{ width: `${chance}%` }}></div>
              </div>
              <div className="bar bar-two">
                <div className="mint" style={{ width: `${chance}%` }}></div>
                <div className="red" style={{ width: `${100 - chance}%` }}></div>
              </div>
            </div>

            <div 
              className="ball" 
              style={{ 
                left: `calc(${result}% - 22px)`, // বল সেন্টার করার জন্য
                right: 'auto',
                top: 'calc(50% - 6px)' // বলের পজিশন ঠিক করা হলো
              }}
            ></div>

            <div className="axis">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </section>

        {/* PAYOUT & SLIDER */}
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
                disabled={isRolling}
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
            
            {/* Rebet / Roll Button */}
            <button className="action-btn roll" id="roll" onClick={handleMainRollClick} disabled={isRolling}>
              <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>

            {/* Low (Under) Button */}
            <button className="action-btn low" id="low" onClick={() => handleRoll(false)} disabled={isRolling}>
              <svg className="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span className="prob" id="lowChance">{chance.toFixed(2)}</span>
            </button>

            {/* High (Over) Button */}
            <button className="action-btn high" id="high" onClick={() => handleRoll(true)} disabled={isRolling}>
              <svg className="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="prob" id="highChance">{highChance.toFixed(2)}</span>
            </button>

          </div>

          {/* Smaller Bet Area */}
          <div className="bet-row">
            <div className="bet-input-wrapper">
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
