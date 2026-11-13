/* app/Games/Original/dice/page.tsx */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import GameBottomBar from "../../../../components/GameBottomBar";
import { supabase } from "../../../../lib/supabase/client";
import { useLanguage } from "../../../../lib/LanguageContext";
import "./dice.css";

export default function DiceGamePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("10.00");
  const [rollOver, setRollOver] = useState(50.50);
  const [isOver, setIsOver] = useState(true);
  const [multiplier, setMultiplier] = useState(2.0000);
  const [chance, setChance] = useState(49.5000);

  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [history, setHistory] = useState<{ id: string; value: number; isWin: boolean; profit: number; nonce: number; betAmount: number }[]>([]);
  const [visualSliderValue, setVisualSliderValue] = useState(50.50);

  const historyContainerRef = useRef<HTMLDivElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"manual" | "auto" | "advanced">("manual");

  const [autoBetCount, setAutoBetCount] = useState("0");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [onWinMode, setOnWinMode] = useState<"reset" | "increase">("reset");
  const [onWinValue, setOnWinValue] = useState("0");
  const [onLossMode, setOnLossMode] = useState<"reset" | "increase">("reset");
  const [onLossValue, setOnLossValue] = useState("0");
  const [stopOnProfit, setStopOnProfit] = useState("0.00");
  const [stopOnLoss, setStopOnLoss] = useState("0.00");

  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [autoStats, setAutoStats] = useState({ bets: 0, profit: 0 });
  const isAutoRef = useRef(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isFairnessOpen, setIsFairnessOpen] = useState(false);
  const [isBetHistoryOpen, setIsBetHistoryOpen] = useState(false);

  const [instantBet, setInstantBet] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [clientSeed, setClientSeed] = useState("my_client_seed_123");
  const [serverSeedHash, setServerSeedHash] = useState("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0");
  const [nonce, setNonce] = useState(1);
  const [isSeedVerified, setIsSeedVerified] = useState(false);

  const playDiceSound = () => {
    if (soundEnabled) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
          setBalance(Number(profile.balance) || 0);
        }
      }
    };
    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setIsLoggedIn(true);
      else {
        setIsLoggedIn(false);
        setUserProfile(null);
        setBalance(0);
      }
    });

    return () => {
      isAutoRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollLeft = historyContainerRef.current.scrollWidth;
    }
    if (graphContainerRef.current) {
      graphContainerRef.current.scrollLeft = graphContainerRef.current.scrollWidth;
    }
  }, [history]);

  const handleSliderChange = (value: number) => {
    setRollOver(value);
    setVisualSliderValue(value);
    const newChance = isOver ? 100 - value : value;
    setChance(newChance);
    setMultiplier(99 / newChance);
  };

  const handleToggleMode = () => {
    setIsOver(!isOver);
    const newChance = !isOver ? 100 - rollOver : rollOver;
    setChance(newChance);
    setMultiplier(99 / newChance);
  };

  const handleMultiplierChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) { setMultiplier(0); return; }
    setMultiplier(num);
    if (num <= 1) return;
    const newChance = 99 / num;
    setChance(newChance);
    const newRollOver = isOver ? 100 - newChance : newChance;
    setRollOver(newRollOver);
    setVisualSliderValue(newRollOver);
  };

  const handleChanceChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0 || num >= 100) { setChance(0); return; }
    setChance(num);
    const newMultiplier = 99 / num;
    setMultiplier(newMultiplier);
    const newRollOver = isOver ? 100 - num : num;
    setRollOver(newRollOver);
    setVisualSliderValue(newRollOver);
  };

  const handleRollOverChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0 || num >= 100) { setRollOver(0); return; }
    setRollOver(num);
    setVisualSliderValue(num);
    const newChance = isOver ? 100 - num : num;
    setChance(newChance);
    setMultiplier(99 / newChance);
  };

  const executeBet = async (amountToBet: number) => {
    if (!isLoggedIn || !userProfile) {
      router.push("/user/login");
      throw new Error("Login required");
    }
    if (amountToBet <= 0) throw new Error(t("Invalid bet amount.", "বেট পরিমাণ সঠিক নয়।"));
    if (amountToBet > balance) throw new Error(t("Insufficient balance.", "পর্যাপ্ত ব্যালেন্স নেই।"));

    setIsRolling(true);
    setResult(null);
    setIsWin(null);
    setErrorMsg("");

    playDiceSound();

    try {
      const { data, error } = await supabase.rpc("play_dice_bet", {
        p_bet_amount: amountToBet,
        p_target: rollOver,
        p_is_over: isOver,
        p_multiplier: multiplier,
      });

      if (error) throw error;

      if (data) {
        setVisualSliderValue(data.roll);
        setResult(data.roll);
        setIsWin(data.is_win);
        setBalance(data.new_balance);
        setUserProfile((prev: any) => prev ? { ...prev, balance: data.new_balance } : prev);

        setHistory(prev => [...prev, {
          id: Date.now().toString(),
          value: data.roll,
          isWin: data.is_win,
          profit: data.profit,
          nonce: nonce,
          betAmount: amountToBet,
        }]);

        setNonce(prev => prev + 1);
      }
      return data;
    } catch (err: any) {
      setErrorMsg(err.message || t("Failed to place bet.", "বেট নিতে ব্যর্থ হয়েছে।"));
      throw err;
    } finally {
      setIsRolling(false);
    }
  };

  const handleManualRoll = async () => {
    await executeBet(Number(betAmount)).catch(() => {});
  };

  const toggleAutoBet = () => {
    if (!isLoggedIn || !userProfile) {
      router.push("/user/login");
      return;
    }
    if (isAutoRef.current) {
      isAutoRef.current = false;
      setIsAutoBetting(false);
    } else {
      if (Number(betAmount) <= 0) return setErrorMsg(t("Please enter a valid bet amount.", "সঠিক বেট পরিমাণ লিখুন।"));
      isAutoRef.current = true;
      setIsAutoBetting(true);
      setAutoStats({ bets: 0, profit: 0 });
      runAutoLoop(Number(betAmount), 0, 0);
    }
  };

  const runAutoLoop = async (currentBet: number, currentCount: number, currentProfit: number) => {
    if (!isAutoRef.current) return;

    const maxBets = Number(autoBetCount);
    const profitLimit = Number(stopOnProfit);
    const lossLimit = Number(stopOnLoss);

    if (maxBets > 0 && currentCount >= maxBets) return toggleAutoBet();
    if (profitLimit > 0 && currentProfit >= profitLimit) return toggleAutoBet();
    if (lossLimit > 0 && currentProfit <= -lossLimit) return toggleAutoBet();
    if (currentBet > balance) {
      setErrorMsg(t("Auto stopped: Insufficient balance.", "অটো বন্ধ: পর্যাপ্ত ব্যালেন্স নেই।"));
      return toggleAutoBet();
    }

    try {
      const data = await executeBet(currentBet);
      if (!data) return;

      const newCount = currentCount + 1;
      const newProfit = currentProfit + data.profit;
      setAutoStats({ bets: newCount, profit: newProfit });

      let nextBet = Number(betAmount);
      if (data.is_win && onWinMode === "increase") {
        nextBet = currentBet + (currentBet * Number(onWinValue) / 100);
      } else if (!data.is_win && onLossMode === "increase") {
        nextBet = currentBet + (currentBet * Number(onLossValue) / 100);
      }

      setBetAmount(nextBet.toFixed(2));

      if (isAutoRef.current) {
        setTimeout(() => runAutoLoop(nextBet, newCount, newProfit), 300);
      }
    } catch (err) {
      toggleAutoBet();
    }
  };

  const totalWagered = history.reduce((sum, item) => sum + item.betAmount, 0);
  const totalProfit = history.reduce((sum, item) => sum + item.profit, 0);
  const wins = history.filter(h => h.isWin).length;
  const losses = history.filter(h => !h.isWin).length;

  const generateGraph = () => {
    if (history.length === 0) return null;

    let cumulativeProfit = 0;
    const points = history.map((h) => {
      cumulativeProfit += h.profit;
      return cumulativeProfit;
    });

    const width = Math.max(680, points.length * 18);
    const height = 220;
    const padX = 12;
    const padY = 22;
    const minVal = Math.min(0, ...points);
    const maxVal = Math.max(0, ...points);
    const range = Math.max(maxVal - minVal, 10);
    const y = (value: number) => padY + ((maxVal - value) / range) * (height - padY * 2);
    const coords = points.map((value, index) => ({
      x: padX + (points.length === 1 ? (width - padX * 2) / 2 : index * (width - padX * 2) / (points.length - 1)),
      y: y(value),
      value,
    }));
    const zeroY = y(0);

    let curvePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];
      const midX = (current.x + next.x) / 2;
      curvePath += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${curvePath} L ${coords[coords.length - 1].x} ${zeroY} L ${coords[0].x} ${zeroY} Z`;
    const segments = coords.slice(0, -1).map((point, index) => {
      const next = coords[index + 1];
      const midX = (point.x + next.x) / 2;
      const segmentPath = `M ${point.x} ${point.y} C ${midX} ${point.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
      const rising = next.value >= point.value;
      return (
        <path
          key={index}
          d={segmentPath}
          fill="none"
          stroke={rising ? "#20e33b" : "#ed4058"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Cumulative session profit graph"
        style={{ width: `${width}px`, height: "100%", minHeight: `${height}px`, display: "block" }}
      >
        <defs>
          <linearGradient id="diceGraphFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#20e33b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#20e33b" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#diceGraphFill)" />
        <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="#718895" strokeOpacity="0.45" strokeWidth="1.2" />
        {segments}
      </svg>
    );
  };

  return (
    <div className="stake-app">
      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      <main className="stake-main" style={{ paddingBottom: "80px" }}>
        <div className="dice-game-container">
          <div className="dice-main-area">

            <div className="dice-history-wrapper">
              <div className="dice-history-container" ref={historyContainerRef}>
                {history.map((item) => (
                  <div key={item.id} className={`dice-history-item ${item.isWin ? "win" : "lose"}`}>
                    {item.value.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: "rgba(255,77,77,0.1)", color: "#ff4d4d", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <div className="dice-slider-section">
              <div className="dice-slider-track">

                {(isRolling || result !== null) && (
                  <div
                    className={`dice-floating-result ${isWin === true ? "win" : isWin === false ? "lose" : ""}`}
                    style={{ left: `${visualSliderValue}%` }}
                  >
                    {visualSliderValue.toFixed(2)}
                    <div className="arrow-down"></div>
                  </div>
                )}

                <div className="dice-track-fill" style={{
                  background: isOver
                    ? `linear-gradient(to right, #ff4d4d ${rollOver}%, #00e701 ${rollOver}%)`
                    : `linear-gradient(to right, #00e701 ${rollOver}%, #ff4d4d ${rollOver}%)`
                }} />

                <input
                  type="range" min="0" max="100" step="0.01"
                  value={visualSliderValue}
                  readOnly
                  className="dice-visual-slider"
                />

                <input
                  type="range" min="2" max="98" step="0.01"
                  value={rollOver}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="dice-main-slider"
                  disabled={isAutoBetting}
                />
              </div>

              <div className="dice-slider-numbers">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            <div className="dice-inputs-grid">
              <div className="dice-input-group">
                <label>{t("Multiplier", "মাল্টিপ্লায়ার")}</label>
                <div className={`dice-input-wrapper ${isAutoBetting ? "disabled" : ""}`}>
                  <input
                    type="number"
                    value={multiplier === 0 ? "" : multiplier}
                    onChange={(e) => handleMultiplierChange(e.target.value)}
                    disabled={isAutoBetting}
                  />
                </div>
              </div>
              <div className="dice-input-group">
                <label>{isOver ? t("Roll Over", "রোল ওভার") : t("Roll Under", "রোল আন্ডার")}</label>
                <div className={`dice-input-wrapper ${isAutoBetting ? "disabled" : ""}`} onClick={() => !isAutoBetting && handleToggleMode()} style={{ cursor: isAutoBetting ? "not-allowed" : "pointer" }}>
                  <input
                    type="number"
                    value={rollOver === 0 ? "" : rollOver}
                    onChange={(e) => handleRollOverChange(e.target.value)}
                    disabled={isAutoBetting}
                  />
                  <i className="fa-solid fa-rotate"></i>
                </div>
              </div>
              <div className="dice-input-group">
                <label>{t("Chance", "চান্স")}</label>
                <div className={`dice-input-wrapper ${isAutoBetting ? "disabled" : ""}`}>
                  <input
                    type="number"
                    value={chance === 0 ? "" : chance}
                    onChange={(e) => handleChanceChange(e.target.value)}
                    disabled={isAutoBetting}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            <button
              className={`dice-bet-btn ${isRolling && !isAutoBetting ? "rolling" : ""} ${isAutoBetting ? "stop-btn" : ""}`}
              onClick={activeTab === "manual" ? handleManualRoll : toggleAutoBet}
              disabled={isRolling && !isAutoBetting}
            >
              {isAutoBetting
                ? t("Stop Auto", "অটো বন্ধ")
                : isRolling
                  ? t("Rolling...", "রোল হচ্ছে...")
                  : activeTab === "manual"
                    ? t("Bet", "বেট")
                    : t("Start Auto", "অটো শুরু")}
            </button>

            <div className="dice-amount-section">
              <div className="dice-amount-group">
                <div className="dice-label-row">
                  <label>{t("Bet Amount", "বেট পরিমাণ")}</label>
                  <span className="dice-currency">{t("Balance", "ব্যালেন্স")}: {balance.toFixed(2)} BDT</span>
                </div>
                <div className={`dice-amount-input-wrap ${isAutoBetting ? "disabled" : ""}`}>
                  <div className="dice-currency-icon">
                    <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                  </div>
                  <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="0.00" disabled={isAutoBetting} />
                  <div className="dice-quick-btns">
                    <button type="button" onClick={() => setBetAmount((Number(betAmount) / 2).toFixed(2))} disabled={isAutoBetting}>½</button>
                    <button type="button" onClick={() => setBetAmount((Number(betAmount) * 2).toFixed(2))} disabled={isAutoBetting}>2x</button>
                  </div>
                </div>
              </div>
              <div className="dice-amount-group">
                <div className="dice-label-row">
                  <label>{t("Profit", "লাভ")}</label>
                  <span className="dice-currency">0.00000000 BDT</span>
                </div>
                <div className={`dice-amount-input-wrap ${isAutoBetting ? "disabled" : ""}`}>
                  <div className="dice-currency-icon">
                    <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                  </div>
                  <input type="number" value={(Number(betAmount) * multiplier - Number(betAmount)).toFixed(2)} readOnly placeholder="0.00" />
                </div>
              </div>
            </div>

            {activeTab === "auto" && (
              <div className="dice-auto-settings">
                {isAutoBetting && (
                  <div style={{ background: "rgba(0, 231, 1, 0.1)", border: "1px solid #00e701", padding: "10px", borderRadius: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontSize: "13px" }}>{t("Bets", "বেট")}: <strong>{autoStats.bets}</strong></span>
                    <span style={{ color: autoStats.profit >= 0 ? "#00e701" : "#ff4d4d", fontSize: "13px", fontWeight: "bold" }}>
                      {t("Profit", "লাভ")}: {autoStats.profit.toFixed(2)} BDT
                    </span>
                  </div>
                )}

                <div className={`dice-input-group ${isAutoBetting ? "disabled" : ""}`}>
                  <label>{t("Number of Bets", "বেট সংখ্যা")}</label>
                  <div className="dice-input-wrapper">
                    <input type="number" value={autoBetCount} onChange={(e) => setAutoBetCount(e.target.value)} disabled={isAutoBetting} />
                    <i className="fa-solid fa-infinity"></i>
                  </div>
                </div>

                <div className="auto-advanced-toggle">
                  <label>{t("Advanced", "অ্যাডভান্সড")}</label>
                  <div className={`toggle-switch ${isAdvanced ? "active" : ""}`} onClick={() => !isAutoBetting && setIsAdvanced(!isAdvanced)} style={{ opacity: isAutoBetting ? 0.5 : 1, cursor: isAutoBetting ? "not-allowed" : "pointer" }}>
                    <div className="toggle-knob"></div>
                  </div>
                </div>

                {isAdvanced && (
                  <div className="advanced-options">
                    <div className="adv-row">
                      <label>{t("On Win", "জিতলে")}</label>
                      <div className="adv-inputs">
                        <select value={onWinMode} onChange={(e) => setOnWinMode(e.target.value as any)} disabled={isAutoBetting}>
                          <option value="reset">{t("Reset", "রিসেট")}</option>
                          <option value="increase">{t("Increase by", "বাড়ান")}</option>
                        </select>
                        <div className="dice-input-wrapper" style={{ width: "100px" }}>
                          <input type="number" value={onWinValue} onChange={(e) => setOnWinValue(e.target.value)} disabled={onWinMode === "reset" || isAutoBetting} />
                          <span>%</span>
                        </div>
                      </div>
                    </div>

                    <div className="adv-row">
                      <label>{t("On Loss", "হারলে")}</label>
                      <div className="adv-inputs">
                        <select value={onLossMode} onChange={(e) => setOnLossMode(e.target.value as any)} disabled={isAutoBetting}>
                          <option value="reset">{t("Reset", "রিসেট")}</option>
                          <option value="increase">{t("Increase by", "বাড়ান")}</option>
                        </select>
                        <div className="dice-input-wrapper" style={{ width: "100px" }}>
                          <input type="number" value={onLossValue} onChange={(e) => setOnLossValue(e.target.value)} disabled={onLossMode === "reset" || isAutoBetting} />
                          <span>%</span>
                        </div>
                      </div>
                    </div>

                    <div className="dice-input-group">
                      <label>{t("Stop on Profit", "লাভে থামুন")}</label>
                      <div className="dice-input-wrapper">
                        <input type="number" value={stopOnProfit} onChange={(e) => setStopOnProfit(e.target.value)} disabled={isAutoBetting} />
                        <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                      </div>
                    </div>

                    <div className="dice-input-group">
                      <label>{t("Stop on Loss", "লসে থামুন")}</label>
                      <div className="dice-input-wrapper">
                        <input type="number" value={stopOnLoss} onChange={(e) => setStopOnLoss(e.target.value)} disabled={isAutoBetting} />
                        <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="dice-bottom-tabs">
              <button className={activeTab === "manual" ? "active" : ""} onClick={() => setActiveTab("manual")} disabled={isAutoBetting}>{t("Manual", "ম্যানুয়াল")}</button>
              <button className={activeTab === "auto" ? "active" : ""} onClick={() => setActiveTab("auto")} disabled={isAutoBetting}>{t("Auto", "অটো")}</button>
              <button className={activeTab === "advanced" ? "active" : ""} onClick={() => setActiveTab("advanced")} disabled={isAutoBetting}>{t("Advanced", "অ্যাডভান্সড")}</button>
            </div>

            <GameBottomBar
              onSettingsClick={() => setIsSettingsOpen(true)}
              onStatsClick={() => setIsGraphOpen(true)}
              onFairnessClick={() => setIsFairnessOpen(true)}
            />

          </div>
        </div>
      </main>

      {isSettingsOpen && (
        <div className="dice-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="dice-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dice-modal-header">
              <h3>{t("Settings", "সেটিংস")}</h3>
              <button onClick={() => setIsSettingsOpen(false)}>✕</button>
            </div>
            <div className="dice-modal-body">
              <div className="dice-setting-row">
                <span>{t("Instant Bet (Turbo)", "ইনস্ট্যান্ট বেট (টার্বো)")}</span>
                <div className={`toggle-switch ${instantBet ? "active" : ""}`} onClick={() => setInstantBet(!instantBet)}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="dice-setting-row">
                <span>{t("Sound Effects", "সাউন্ড ইফেক্ট")}</span>
                <div className={`toggle-switch ${soundEnabled ? "active" : ""}`} onClick={() => setSoundEnabled(!soundEnabled)}>
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <button
                className="dice-btn-secondary"
                style={{ width: "100%", marginTop: "15px" }}
                onClick={() => { setIsSettingsOpen(false); setIsBetHistoryOpen(true); }}
              >
                {t("View Bet History", "বেট হিস্ট্রি দেখুন")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBetHistoryOpen && (
        <div className="dice-modal-overlay" onClick={() => setIsBetHistoryOpen(false)}>
          <div className="dice-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dice-modal-header">
              <h3>{t("Bet History", "বেট হিস্ট্রি")}</h3>
              <button onClick={() => setIsBetHistoryOpen(false)}>✕</button>
            </div>
            <div className="dice-modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {history.length === 0 ? (
                <p style={{ textAlign: "center", color: "#aaa" }}>{t("No bets placed yet.", "এখনো কোনো বেট নেই।")}</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#fff" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #23332b", textAlign: "left" }}>
                      <th style={{ padding: "8px 4px" }}>{t("Nonce", "নন্স")}</th>
                      <th style={{ padding: "8px 4px" }}>{t("Roll", "রোল")}</th>
                      <th style={{ padding: "8px 4px" }}>{t("Result", "ফলাফল")}</th>
                      <th style={{ padding: "8px 4px", textAlign: "right" }}>{t("Profit", "লাভ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h) => (
                      <tr key={h.id} style={{ borderBottom: "1px dashed #23332b" }}>
                        <td style={{ padding: "8px 4px", color: "#a0aab2" }}>{h.nonce}</td>
                        <td style={{ padding: "8px 4px" }}>{h.value.toFixed(2)}</td>
                        <td style={{ padding: "8px 4px", color: h.isWin ? "#00e701" : "#ff4d4d" }}>
                          {h.isWin ? t("Win", "জয়") : t("Loss", "হার")}
                        </td>
                        <td style={{ padding: "8px 4px", textAlign: "right", color: h.profit > 0 ? "#00e701" : "#ff4d4d" }}>
                          {h.profit > 0 ? "+" : ""}{h.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {isGraphOpen && (
        <div
          className="dice-modal-overlay"
          onClick={() => setIsGraphOpen(false)}
          style={{ backdropFilter: "none", backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <div className="dice-modal-content dice-stats-modal" onClick={e => e.stopPropagation()} style={{ width: "min(720px, calc(100vw - 24px))", maxWidth: "720px" }}>

            <div className="dice-modal-header" style={{ borderBottom: "none", paddingBottom: "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a0aab2" }}>
                <i className="fa-solid fa-chart-simple" style={{ fontSize: "18px", color: "#a0aab2" }}></i>
                <h3 style={{ fontSize: "1.1rem", color: "#fff", margin: 0, fontWeight: "bold" }}>{t("Live Stats", "লাইভ স্ট্যাটস")}</h3>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <button onClick={() => setIsGraphOpen(false)} style={{ fontSize: "1.2rem", color: "#a0aab2", background: "transparent", border: "none", cursor: "pointer" }}><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>

            <div className="dice-modal-body" style={{ padding: "10px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", background: "#1a2c38", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>
                    {t("Bets", "বেট")} <i className="fa-solid fa-chevron-down" style={{ fontSize: "10px" }}></i>
                  </div>
                  <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", background: "#1a2c38", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>
                    {t("All", "সব")} <i className="fa-solid fa-chevron-down" style={{ fontSize: "10px" }}></i>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "#a0aab2" }}>
                  <i className="fa-solid fa-thumbtack" style={{ transform: "rotate(45deg)", fontSize: "14px" }}></i>
                  <i className="fa-solid fa-rotate-right" style={{ fontSize: "14px" }}></i>
                </div>
              </div>

              <div className="dice-stats-grid" style={{ padding: "12px", background: "#1a2c38", borderRadius: "8px" }}>
                <div className="dice-stat-item">
                  <span className="dice-stat-label" style={{ fontSize: "0.7rem" }}>{t("Profit", "লাভ")}</span>
                  <span className={`dice-stat-value ${totalProfit >= 0 ? "text-green" : "text-red"}`} style={{ fontSize: "1rem", fontWeight: "bold" }}>
                    {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="dice-stat-item">
                  <span className="dice-stat-label" style={{ fontSize: "0.7rem" }}>{t("Wagered", "ওয়েজার্ড")}</span>
                  <span className="dice-stat-value" style={{ fontSize: "1rem", fontWeight: "bold" }}>{totalWagered.toFixed(2)}</span>
                </div>
                <div className="dice-stat-item" style={{ marginTop: "10px" }}>
                  <span className="dice-stat-label" style={{ fontSize: "0.7rem" }}>{t("Wins", "জয়")}</span>
                  <span className="dice-stat-value text-green" style={{ fontSize: "1rem", fontWeight: "bold" }}>{wins}</span>
                </div>
                <div className="dice-stat-item" style={{ marginTop: "10px" }}>
                  <span className="dice-stat-label" style={{ fontSize: "0.7rem" }}>{t("Losses", "হার")}</span>
                  <span className="dice-stat-value text-red" style={{ fontSize: "1rem", fontWeight: "bold" }}>{losses}</span>
                </div>
              </div>

              <div
                className="dice-graph-area"
                ref={graphContainerRef}
                style={{ height: "220px", marginTop: "14px", borderRadius: "12px", overflowX: "auto", overflowY: "hidden" }}
              >
                {history.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#a0aab2", padding: "40px 0", fontSize: "12px" }}>{t("No bets placed yet", "এখনো কোনো বেট নেই")}</div>
                ) : (
                  generateGraph()
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {isFairnessOpen && (
        <div className="dice-modal-overlay" onClick={() => setIsFairnessOpen(false)}>
          <div className="dice-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dice-modal-header">
              <h3>{t("Provably Fair", "প্রুভেবলি ফেয়ার")}</h3>
              <button onClick={() => setIsFairnessOpen(false)}>✕</button>
            </div>
            <div className="dice-modal-body">
              <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "15px" }}>
                {t(
                  "Dice uses a provably fair system to ensure every roll is completely random and cannot be manipulated.",
                  "ডাইস প্রুভেবলি ফেয়ার সিস্টেম ব্যবহার করে যাতে প্রতিটি রোল সম্পূর্ণ র‍্যান্ডম হয় এবং কারচুপি করা না যায়।"
                )}
              </p>

              <div className="dice-fairness-group">
                <label>{t("Server Seed (Hashed)", "সার্ভার সিড (হ্যাশড)")}</label>
                <div className="dice-fairness-input">
                  <code>{serverSeedHash}</code>
                </div>
              </div>

              <div className="dice-fairness-group">
                <label>{t("Client Seed (Editable)", "ক্লায়েন্ট সিড (সম্পাদনযোগ্য)")}</label>
                <div className="dice-fairness-input">
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => { setClientSeed(e.target.value); setIsSeedVerified(false); }}
                  />
                </div>
              </div>

              <div className="dice-fairness-group">
                <button
                  className="dice-btn-secondary"
                  style={{ width: "100%", marginBottom: "10px" }}
                  onClick={() => {
                    const newSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    setClientSeed(newSeed);
                    setIsSeedVerified(false);
                  }}
                >
                  {t("Change Seed", "সিড পরিবর্তন")}
                </button>

                <button
                  className={`dice-btn-secondary ${isSeedVerified ? "verified" : ""}`}
                  style={{ width: "100%", background: isSeedVerified ? "#00e701" : "", color: isSeedVerified ? "#000" : "" }}
                  onClick={() => setIsSeedVerified(true)}
                >
                  {isSeedVerified ? t("Seed Verified ✓", "সিড ভেরিফাইড ✓") : t("Verify Seed", "সিড যাচাই")}
                </button>
              </div>

              <div className="dice-fairness-group">
                <label>{t("Nonce", "নন্স")}</label>
                <div className="dice-fairness-input">
                  <code>{nonce}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
