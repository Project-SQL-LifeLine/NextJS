"use client";

import { useState } from "react";
import "./dice.css";

export default function DiceGamePage() {
  // স্টেট
  const [bet, setBet] = useState(1.00);
  const [chance, setChance] = useState(48.5);
  
  // রোলিং এবং রেজাল্ট স্টেট
  const [result, setResult] = useState(95.01);
  const [isRolling, setIsRolling] = useState(false);
  const [isWin, setIsWin] = useState<boolean | null>(null);

  // হিস্ট্রি ডাটা
  const [historyData, setHistoryData] = useState([
    { val: "95.01", isGreen: true },
    { val: "44.33", isGreen: false },
    { val: "55.33", isGreen: false },
    { val: "85.45", isGreen: true },
    { val: "19.17", isGreen: true },
    { val: "49", isGreen: false },
  ]);

  // ক্যালকুলেশন
  const payout = 99 / chance;
  const highChance = 100 - chance;
  const potentialWin = bet * payout;

  // রোল করার ফাংশন (লো এবং হাই উভয়ের জন্য)
  const handleRoll = (isHigh: boolean) => {
    if (isRolling) return; // যদি আগে থেকেই রোলিং চলে, তবে আবার রোল হবে না

    setIsRolling(true);
    setIsWin(null);

    let rollCount = 0;
    const duration = 1000; // ১ সেকেন্ড অ্যানিমেশন
    const intervalTime = 50; 

    const interval = setInterval(() => {
      // অ্যানিমেশনের জন্য র‍্যান্ডম নাম্বার জেনারেট
      const animResult = Math.random() * 100;
      setResult(Number(animResult.toFixed(2)));
      rollCount++;

      if (rollCount * intervalTime >= duration) {
        clearInterval(interval);
        
        // আসল রেজাল্ট জেনারেট
        const finalResult = Math.random() * 100;
        setResult(Number(finalResult.toFixed(2)));
        setIsRolling(false);

        // জেতা বা হারা নির্ধারণ
        const win = isHigh ? finalResult >= chance : finalResult < chance;
        setIsWin(win);

        // হিস্ট্রি আপডেট
        setHistoryData(prev => [
          { val: finalResult.toFixed(2), isGreen: win },
          ...prev
        ].slice(0, 6));
      }
    }, intervalTime);
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

            {/* ডাইনামিক বার (যা স্লাইডারের সাথে পরিবর্তন হবে) */}
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

            {/* ডাইনামিক বল (রোলিং সিম্বল) */}
            <div 
              className="ball" 
              style={{ 
                left: `calc(${result}% - 28px)`, // ৫৬ পিক্সেল বলের অর্ধেক বাদ দিয়ে সেন্টার করা হয়েছে
                right: 'auto' // আগের রাইট পজিশন বাতিল
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
                disabled={isRolling} // রোলিং চলাকালীন স্লাইডার লক থাকবে
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
            {/* সেন্টার রোল বাটন (এটি ক্লিক করলে ডিফল্টভাবে Low-তে বেট হবে) */}
            <button className="action-btn roll" id="roll" onClick={() => handleRoll(false)} disabled={isRolling}>
              ⟳
              <span style={{ fontSize: '25px', position: 'absolute' }}>▶</span>
            </button>

            {/* Low (Under) বাটন */}
            <button className="action-btn low" id="low" onClick={() => handleRoll(false)} disabled={isRolling}>
              <span className="arrow">⌄</span>
              <span className="prob" id="lowChance">{chance.toFixed(2)}</span>
            </button>

            {/* High (Over) বাটন */}
            <button className="action-btn high" id="high" onClick={() => handleRoll(true)} disabled={isRolling}>
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
