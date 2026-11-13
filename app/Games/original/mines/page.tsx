/* app/Games/original/mines/page.tsx */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import GameBottomBar from "../../../../components/GameBottomBar/GameBottomBar";
import { supabase } from "../../../../lib/supabase/client";
import { useLanguage } from "../../../../lib/LanguageContext";
import "./mines.css";

type Tile = {
  index: number;
  isRevealed: boolean;
  isBomb: boolean;
};

type HistoryItem = {
  id: string;
  value: number;
  isWin: boolean;
  profit: number;
  nonce: number;
  betAmount: number;
};

type SuggestedGame = {
  id: string;
  game_name: string;
  game_image: string;
  game_link: string;
  border_color: string;
  ribbon_color: string;
  ribbon_text: string;
  show_border: boolean;
  show_ribbon: boolean;
  show_title: boolean;
};

export default function MinesGamePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("10.00");
  const [minesCount, setMinesCount] = useState(3);

  // ট্যাব স্টেট
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");

  // গেম স্টেট
  const [gameId, setGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // গ্রিড ও মাল্টিপ্লায়ার স্টেট
  const [tiles, setTiles] = useState<Tile[]>(Array.from({ length: 25 }, (_, i) => ({ index: i, isRevealed: false, isBomb: false })));
  const [multiplier, setMultiplier] = useState(1.00);
  const [profit, setProfit] = useState(0);

  // অটো বেট স্টেট
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [autoStats, setAutoStats] = useState({ bets: 0, profit: 0 });
  const isAutoRef = useRef(false);
  const [autoTiles, setAutoTiles] = useState("3"); 
  const [autoBetCount, setAutoBetCount] = useState("0");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [onWinMode, setOnWinMode] = useState<"reset" | "increase">("reset");
  const [onWinValue, setOnWinValue] = useState("0");
  const [onLossMode, setOnLossMode] = useState<"reset" | "increase">("reset");
  const [onLossValue, setOnLossValue] = useState("0");
  const [stopOnProfit, setStopOnProfit] = useState("0.00");
  const [stopOnLoss, setStopOnLoss] = useState("0.00");

  // হিস্টোরি, গ্রাফ ও সাজেশন
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestedGames, setSuggestedGames] = useState<SuggestedGame[]>([]);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isFairnessOpen, setIsFairnessOpen] = useState(false);
  const [isBetHistoryOpen, setIsBetHistoryOpen] = useState(false); 

  // Settings & Fairness
  const [instantBet, setInstantBet] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clientSeed, setClientSeed] = useState("my_client_seed_123");
  const [serverSeedHash, setServerSeedHash] = useState("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0");
  const [nonce, setNonce] = useState(1);
  const [isSeedVerified, setIsSeedVerified] = useState(false);
  const [fairnessView, setFairnessView] = useState<"main" | "change_seed" | "verify_seed">("main");

  const playSound = (type: "click" | "win" | "lose") => {
    if (!soundEnabled) return;
    const urls = {
      click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      win: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
      lose: "https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3"
    };
    const audio = new Audio(urls[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio blocked:", e));
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) {
          setUserProfile(data);
          setBalance(Number(data.balance) || 0);
        }
      }

      const { data: suggestData } = await supabase
        .from("suggested_game")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (suggestData) setSuggestedGames(suggestData);
    };
    
    void fetchData();

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

  // 🎮 ম্যানুয়াল গেম শুরু
  const handleStartGame = async () => {
    if (!isLoggedIn || !userProfile) {
      router.push("/user/login");
      return;
    }
    const amount = Number(betAmount);
    if (amount <= 0) return setErrorMsg(t("Invalid bet amount.", "বেট পরিমাণ সঠিক নয়।"));
    if (amount > balance) return setErrorMsg(t("Insufficient balance.", "পর্যাপ্ত ব্যালেন্স নেই।"));

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.rpc("start_mines_game", {
        p_bet_amount: amount,
        p_mines_count: minesCount
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error);

      if (data) {
        setGameId(data.game_id);
        // ✅ নতুন SQL এর balance_after হ্যান্ডেল করা হলো
        const newBal = Number(data.balance_after || data.new_balance);
        setBalance(newBal);
        setUserProfile((prev: any) => prev ? { ...prev, balance: newBal } : prev);
        
        setIsPlaying(true);
        setMultiplier(1.00);
        setProfit(0);
        setTiles(Array.from({ length: 25 }, (_, i) => ({ index: i, isRevealed: false, isBomb: false })));
        playSound("click");
      }
    } catch (err: any) {
      setErrorMsg(err.message || t("Failed to start game.", "গেম শুরু করতে ব্যর্থ হয়েছে।"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 💎 ম্যানুয়াল ঘর খোলা
  const handleRevealTile = async (index: number) => {
    if (!isLoggedIn || !isPlaying || isProcessing || tiles[index].isRevealed) return;

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.rpc("reveal_mines_tile", {
        p_game_id: gameId,
        p_tile_index: index
      });

      if (error) throw error;

      if (data) {
        if (data.is_bomb) {
          setIsPlaying(false);
          setMultiplier(0);
          setProfit(-Number(betAmount));
          playSound("lose");
          
          setTiles(prev => {
            const newTiles = [...prev];
            data.bombs.forEach((bombIdx: number) => {
              newTiles[bombIdx] = { ...newTiles[bombIdx], isRevealed: true, isBomb: true };
            });
            return newTiles;
          });

          setHistory(prev => [...prev, {
            id: Date.now().toString(), value: 0, isWin: false, profit: -Number(betAmount), nonce: nonce, betAmount: Number(betAmount)
          }]);
          setNonce(prev => prev + 1);
        } else {
          const mult = data.new_multiplier !== undefined ? data.new_multiplier : data.multiplier;
          const newMult = Number(mult);
          setMultiplier(isNaN(newMult) ? 1.00 : newMult);
          setProfit(Number(betAmount) * (isNaN(newMult) ? 1.00 : newMult) - Number(betAmount));
          playSound("click");
          
          setTiles(prev => {
            const newTiles = [...prev];
            newTiles[index] = { ...newTiles[index], isRevealed: true, isBomb: false };
            return newTiles;
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || t("Failed to reveal tile.", "ঘর খুলতে ব্যর্থ হয়েছে।"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 💰 ম্যানুয়াল ক্যাশআউট
  const handleCashout = async () => {
    if (!isLoggedIn || !isPlaying || multiplier <= 1.00) return;

    setIsProcessing(true);
    setErrorMsg("");

    try {
      // ✅ নতুন SQL এর নাম cashout_mines_game
      const { data, error } = await supabase.rpc("cashout_mines_game", {
        p_game_id: gameId
      });

      if (error) throw error;

      if (data) {
        setIsPlaying(false);
        const newBal = Number(data.balance_after || data.new_balance);
        setBalance(newBal);
        setUserProfile((prev: any) => prev ? { ...prev, balance: newBal } : prev);
        playSound("win");
        
        setTiles(prev => {
          const newTiles = [...prev];
          if (data.bombs) {
            data.bombs.forEach((bombIdx: number) => {
              newTiles[bombIdx] = { ...newTiles[bombIdx], isRevealed: true, isBomb: true };
            });
          }
          return newTiles;
        });

        const winProfit = Number(betAmount) * Number(multiplier) - Number(betAmount);
        setHistory(prev => [...prev, {
          id: Date.now().toString(), value: Number(multiplier), isWin: true, profit: winProfit, nonce: nonce, betAmount: Number(betAmount)
        }]);
        setNonce(prev => prev + 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || t("Failed to cashout.", "ক্যাশআউট করতে ব্যর্থ হয়েছে।"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 🤖 অটো বেট টগল
  const toggleAutoBet = () => {
    if (!isLoggedIn || !userProfile) {
      router.push("/user/login");
      return;
    }
    if (isAutoRef.current) {
      isAutoRef.current = false;
      setIsAutoBetting(false);
    } else {
      const amount = Number(betAmount);
      const tilesToReveal = Number(autoTiles);
      
      if (amount <= 0) return setErrorMsg(t("Invalid bet amount.", "বেট পরিমাণ সঠিক নয়।"));
      if (tilesToReveal <= 0 || tilesToReveal > (25 - minesCount)) {
        return setErrorMsg(t(`You can reveal between 1 and ${25 - minesCount} tiles.`, `আপনি ১ থেকে ${25 - minesCount} টি ঘর খুলতে পারবেন।`));
      }

      isAutoRef.current = true;
      setIsAutoBetting(true);
      setAutoStats({ bets: 0, profit: 0 });
      runAutoLoop(amount, 0, 0); 
    }
  };

  // 🤖 অটো বেট লুপ
  const runAutoLoop = async (currentBet: number, currentCount: number, currentProfit: number) => {
    if (!isAutoRef.current) return;

    const maxBets = Number(autoBetCount);
    const profitLimit = Number(stopOnProfit);
    const lossLimit = Number(stopOnLoss);
    const tilesToReveal = Number(autoTiles);

    if (maxBets > 0 && currentCount >= maxBets) return toggleAutoBet();
    if (profitLimit > 0 && currentProfit >= profitLimit) return toggleAutoBet();
    if (lossLimit > 0 && currentProfit <= -lossLimit) return toggleAutoBet();
    if (currentBet > balance) {
      setErrorMsg(t("Auto stopped: Insufficient balance.", "অটো বন্ধ: পর্যাপ্ত ব্যালেন্স নেই।"));
      return toggleAutoBet();
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const { data: startData, error: startError } = await supabase.rpc("start_mines_game", {
        p_bet_amount: currentBet,
        p_mines_count: minesCount
      });

      if (startError) throw startError;
      if (startData && startData.success === false) throw new Error(startData.error);
      
      setGameId(startData.game_id);
      const startBal = Number(startData.balance_after || startData.new_balance);
      setBalance(startBal);
      setUserProfile((prev: any) => prev ? { ...prev, balance: startBal } : prev);
      
      let newTilesState = Array.from({ length: 25 }, (_, i) => ({ index: i, isRevealed: false, isBomb: false }));
      setTiles([...newTilesState]);

      let roundProfit = 0;
      let isRoundWin = false;
      let currentMultiplier = 1.00;
      let availableTiles = Array.from({ length: 25 }, (_, i) => i);

      for (let i = 0; i < tilesToReveal; i++) {
        const randomIndex = Math.floor(Math.random() * availableTiles.length);
        const tileIndex = availableTiles[randomIndex];
        availableTiles.splice(randomIndex, 1);

        await new Promise(res => setTimeout(res, instantBet ? 10 : 300));

        const { data: tileData, error: tileError } = await supabase.rpc("reveal_mines_tile", {
          p_game_id: startData.game_id,
          p_tile_index: tileIndex
        });

        if (tileError) throw tileError;

        if (tileData.is_bomb) {
          isRoundWin = false;
          roundProfit = -currentBet;
          if (tileData.bombs) {
            tileData.bombs.forEach((bIdx: number) => { newTilesState[bIdx] = { ...newTilesState[bIdx], isRevealed: true, isBomb: true }; });
          }
          setTiles([...newTilesState]);
          playSound("lose");
          break; 
        } else {
          const mult = tileData.new_multiplier !== undefined ? tileData.new_multiplier : tileData.multiplier;
          currentMultiplier = isNaN(Number(mult)) ? 1.00 : Number(mult);
          newTilesState[tileIndex] = { ...newTilesState[tileIndex], isRevealed: true, isBomb: false };
          setTiles([...newTilesState]);
          playSound("click");

          if (i === tilesToReveal - 1) {
            const { data: cashoutData, error: cashoutError } = await supabase.rpc("cashout_mines_game", { p_game_id: startData.game_id });
            if (cashoutError) throw cashoutError;
            
            isRoundWin = true;
            const endBal = Number(cashoutData.balance_after || cashoutData.new_balance);
            setBalance(endBal);
            setUserProfile((prev: any) => prev ? { ...prev, balance: endBal } : prev);
            roundProfit = (currentBet * currentMultiplier) - currentBet;
            
            if (cashoutData.bombs) {
              cashoutData.bombs.forEach((bIdx: number) => { newTilesState[bIdx] = { ...newTilesState[bIdx], isRevealed: true, isBomb: true }; });
            }
            setTiles([...newTilesState]);
            playSound("win");
          }
        }
      }

      const newCount = currentCount + 1;
      const newProfit = currentProfit + roundProfit;
      setAutoStats({ bets: newCount, profit: newProfit });

      setHistory(prev => [...prev, {
        id: Date.now().toString(), value: isRoundWin ? currentMultiplier : 0, isWin: isRoundWin, profit: roundProfit, nonce: nonce + newCount, betAmount: currentBet
      }]);

      let nextBet = currentBet;
      if (isRoundWin && onWinMode === "increase") {
        nextBet = currentBet + (currentBet * Number(onWinValue) / 100);
      } else if (!isRoundWin && onLossMode === "increase") {
        nextBet = currentBet + (currentBet * Number(onLossValue) / 100);
      }
      setBetAmount(nextBet.toFixed(2));

      if (isAutoRef.current) {
        setTimeout(() => runAutoLoop(nextBet, newCount, newProfit), 1200); 
      }

    } catch (err: any) {
      setErrorMsg(err.message || t("Failed during auto bet.", "অটো বেট চলাকালীন ব্যর্থ হয়েছে।"));
      toggleAutoBet();
    } finally {
      setIsProcessing(false);
    }
  };

  const totalWagered = history.reduce((sum, item) => sum + item.betAmount, 0);
  const totalProfit = history.reduce((sum, item) => sum + item.profit, 0);
  const wins = history.filter(h => h.isWin).length;
  const losses = history.filter(h => !h.isWin).length;

  const generateGraph = () => {
    if (history.length === 0) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <svg viewBox={`0 0 280 140`} style={{ width: '100%', height: '100%', display: 'block' }}>
             <line x1="0" y1="70" x2="280" y2="70" stroke="#2b4236" strokeWidth="1" />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aab2', fontSize: '12px' }}>
            {t("No bets placed yet", "এখনো কোনো বেট নেই")}
          </div>
        </div>
      );
    }
    
    let cumulative = 0;
    const points = [0]; 
    history.forEach(h => { cumulative += h.profit; points.push(cumulative); });

    const maxAbs = Math.max(...points.map(Math.abs), 1); 
    const width = 280; 
    const height = 140; 
    const centerY = height / 2;
    const padding = 15;
    
    const stepX = (width - 2 * padding) / Math.max(points.length - 1, 1);
    const getX = (index: number) => padding + index * stepX;
    const getY = (val: number) => centerY - (val / maxAbs) * (centerY - padding);

    let areaPath = `M ${getX(0)} ${centerY} L ${getX(0)} ${getY(points[0])}`;
    for (let i = 1; i < points.length; i++) {
      areaPath += ` L ${getX(i)} ${getY(points[i])}`;
    }
    areaPath += ` L ${getX(points.length - 1)} ${centerY} Z`;

    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = getX(i);
      const y1 = getY(points[i]);
      const x2 = getX(i + 1);
      const y2 = getY(points[i + 1]);
      const isGreen = points[i + 1] >= 0;
      const color = isGreen ? "#00E701" : "#ff4d4d";

      segments.push(<line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />);
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E701" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#00E701" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#2b4236" strokeWidth="1" />
        <clipPath id="aboveCenter"><rect x="0" y="0" width={width} height={centerY} /></clipPath>
        <path d={areaPath} fill="url(#greenGradient)" clipPath="url(#aboveCenter)" />
        {segments}
      </svg>
    );
  };

  const latestResult = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="stake-app">
      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      <main className="stake-main" style={{ paddingBottom: '80px' }}>
        <div className="limbo-game-container">
          <div className="limbo-main-area">
            
            <div className="limbo-history-wrapper">
              <div className="limbo-history-container" ref={historyContainerRef}>
                {history.map((item) => (
                  <div key={item.id} className={`limbo-history-item ${item.isWin ? 'win' : 'lose'}`}>
                    {item.isWin ? `${Number(item.value).toFixed(2)}x` : t("Loss", "হার")}
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: "rgba(255,77,77,0.1)", color: "#ff4d4d", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <div className="mines-grid-container">
              {tiles.map((tile) => (
                <div
                  key={tile.index}
                  className={`mines-tile ${tile.isRevealed ? 'revealed' : ''} ${tile.isRevealed && tile.isBomb ? 'bomb' : ''} ${tile.isRevealed && !tile.isBomb ? 'safe' : ''} ${(!isPlaying && !isAutoBetting) ? 'disabled' : ''}`}
                  onClick={() => activeTab === "manual" && handleRevealTile(tile.index)}
                >
                  {tile.isRevealed && (
                    tile.isBomb ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff4d4d" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fillOpacity="0.2"/>
                        <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" fill="currentColor"/>
                        <path d="M15.5355 6.05025C16.1213 6.63604 16.1213 7.58579 15.5355 8.17157L13.0607 10.6464C12.4749 11.2322 11.5251 11.2322 10.9393 10.6464C10.3536 10.0607 10.3536 9.11091 10.9393 8.52513L13.4142 6.05025C14 5.46447 14.9497 5.46447 15.5355 6.05025Z" fill="#ff4d4d"/>
                        <path d="M19.5 3.5L22 6M21 3L18.5 5.5" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="#00E701" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2H18L22 8L12 22L2 8L6 2Z" fillOpacity="0.2"/>
                        <path d="M6 2L2 8H22L18 2H6Z" fill="currentColor" />
                        <path d="M12 22L7 8H17L12 22Z" fill="currentColor" fillOpacity="0.8"/>
                        <path d="M2 8L7 8L12 22L2 8Z" fill="currentColor" fillOpacity="0.6"/>
                        <path d="M22 8L17 8L12 22L22 8Z" fill="currentColor" fillOpacity="0.6"/>
                      </svg>
                    )
                  )}
                </div>
              ))}
            </div>

            <div className="limbo-inputs-grid">
              <div className="limbo-input-group">
                <label>{t("Mines", "মাইনস")}</label>
                <div className={`limbo-input-wrapper ${(isPlaying || isAutoBetting) ? 'disabled' : ''}`}>
                  <select className="mines-select" value={minesCount} onChange={(e) => setMinesCount(Number(e.target.value))} disabled={isPlaying || isAutoBetting || isProcessing}>
                    {[1, 3, 5, 10, 15, 24].map(num => <option key={num} value={num}>{num} {t("Mines", "মাইনস")}</option>)}
                  </select>
                </div>
              </div>
              <div className="limbo-input-group">
                <label>{t("Multiplier", "মাল্টিপ্লায়ার")}</label>
                <div className="limbo-input-wrapper">
                  <input type="text" value={`${Number(multiplier).toFixed(2)}x`} readOnly style={{ color: multiplier > 1 ? 'var(--limbo-accent)' : '#fff' }} />
                </div>
              </div>
            </div>

            {activeTab === "manual" ? (
              isPlaying ? (
                <button className="limbo-bet-btn" onClick={handleCashout} disabled={isProcessing || multiplier <= 1.00} style={{ background: multiplier > 1 ? 'var(--limbo-accent)' : '#365244', color: multiplier > 1 ? '#000' : '#fff' }}>
                  {isProcessing ? t("Processing...", "প্রসেসিং...") : multiplier > 1 ? `${t("Cashout", "ক্যাশআউট")} ৳ ${(Number(betAmount) * Number(multiplier)).toFixed(2)}` : t("Pick a Tile", "ঘর বেছে নিন")}
                </button>
              ) : (
                <button className={`limbo-bet-btn ${isProcessing ? "rolling" : ""}`} onClick={handleStartGame} disabled={isProcessing}>
                  {isProcessing ? t("Starting...", "শুরু হচ্ছে...") : t("Bet", "বেট")}
                </button>
              )
            ) : (
              <button className={`limbo-bet-btn ${isAutoBetting ? "stop-btn" : ""}`} onClick={toggleAutoBet} disabled={isProcessing && !isAutoBetting}>
                {isAutoBetting ? t("Stop Auto", "অটো বন্ধ") : t("Start Auto", "অটো শুরু")}
              </button>
            )}

            <div className="limbo-amount-section">
              <div className="limbo-amount-group">
                <div className="limbo-label-row">
                  <label>{t("Bet Amount", "বেট পরিমাণ")}</label>
                  <span className="limbo-currency">{t("Balance", "ব্যালেন্স")}: {Number(balance).toFixed(2)} BDT</span>
                </div>
                <div className={`limbo-amount-input-wrap ${(isPlaying || isAutoBetting) ? 'disabled' : ''}`}>
                  <span style={{ color: 'var(--limbo-muted)', fontSize: '1.1rem', fontWeight: 'bold', marginRight: '8px' }}>৳</span>
                  <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="0.00" disabled={isPlaying || isAutoBetting || isProcessing} />
                  <div className="limbo-quick-btns">
                    <button type="button" onClick={() => setBetAmount((Number(betAmount) / 2).toFixed(2))} disabled={isPlaying || isAutoBetting || isProcessing}>½</button>
                    <button type="button" onClick={() => setBetAmount((Number(betAmount) * 2).toFixed(2))} disabled={isPlaying || isAutoBetting || isProcessing}>2x</button>
                  </div>
                </div>
              </div>
              <div className="limbo-amount-group">
                <div className="limbo-label-row">
                  <label>{t("Profit", "লাভ")}</label>
                  <span className="limbo-currency">0.00000000 BDT</span>
                </div>
                <div className={`limbo-amount-input-wrap ${(isPlaying || isAutoBetting) ? 'disabled' : ''}`}>
                  <span style={{ color: 'var(--limbo-muted)', fontSize: '1.1rem', fontWeight: 'bold', marginRight: '8px' }}>৳</span>
                  <input type="number" value={activeTab === "manual" ? (isPlaying ? Number(profit).toFixed(2) : 0) : Number(autoStats.profit).toFixed(2)} readOnly style={{ color: (activeTab === "manual" ? profit : autoStats.profit) > 0 ? 'var(--limbo-accent)' : (activeTab === "manual" ? profit : autoStats.profit) < 0 ? 'var(--limbo-danger)' : '#fff' }} />
                </div>
              </div>
            </div>

            {activeTab === "auto" && (
              <div className="limbo-auto-settings">
                {isAutoBetting && (
                  <div style={{ background: "rgba(0, 231, 1, 0.1)", border: "1px solid #00e701", padding: "10px", borderRadius: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontSize: "13px" }}>{t("Bets", "বেট")}: <strong>{autoStats.bets}</strong></span>
                    <span style={{ color: autoStats.profit >= 0 ? "#00e701" : "#ff4d4d", fontSize: "13px", fontWeight: "bold" }}>
                      {t("Profit", "লাভ")}: {Number(autoStats.profit).toFixed(2)} BDT
                    </span>
                  </div>
                )}

                <div className={`limbo-input-group ${isAutoBetting ? 'disabled' : ''}`}>
                  <label>{t(`Tiles to Reveal (Max ${25 - minesCount})`, `ঘর খুলবেন (সর্বোচ্চ ${25 - minesCount})`)}</label>
                  <div className="limbo-input-wrapper">
                    <input type="number" value={autoTiles} onChange={(e) => setAutoTiles(e.target.value)} disabled={isAutoBetting} min="1" max={25 - minesCount} />
                  </div>
                </div>

                <div className={`limbo-input-group ${isAutoBetting ? 'disabled' : ''}`}>
                  <label>{t("Number of Bets", "বেট সংখ্যা")}</label>
                  <div className="limbo-input-wrapper">
                    <input type="number" value={autoBetCount} onChange={(e) => setAutoBetCount(e.target.value)} disabled={isAutoBetting} />
                    <i className="fa-solid fa-infinity"></i>
                  </div>
                </div>

                <div className="auto-advanced-toggle">
                  <label>{t("Advanced", "অ্যাডভান্সড")}</label>
                  <div className={`toggle-switch ${isAdvanced ? "active" : ""}`} onClick={() => !isAutoBetting && setIsAdvanced(!isAdvanced)} style={{ opacity: isAutoBetting ? 0.5 : 1, cursor: isAutoBetting ? 'not-allowed' : 'pointer' }}>
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
                        <div className="limbo-input-wrapper" style={{ width: "100px" }}>
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
                        <div className="limbo-input-wrapper" style={{ width: "100px" }}>
                          <input type="number" value={onLossValue} onChange={(e) => setOnLossValue(e.target.value)} disabled={onLossMode === "reset" || isAutoBetting} />
                          <span>%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="limbo-input-group">
                      <label>{t("Stop on Profit", "লাভে থামুন")}</label>
                      <div className="limbo-input-wrapper">
                        <input type="number" value={stopOnProfit} onChange={(e) => setStopOnProfit(e.target.value)} disabled={isAutoBetting} />
                        <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                      </div>
                    </div>

                    <div className="limbo-input-group">
                      <label>{t("Stop on Loss", "লসে থামুন")}</label>
                      <div className="limbo-input-wrapper">
                        <input type="number" value={stopOnLoss} onChange={(e) => setStopOnLoss(e.target.value)} disabled={isAutoBetting} />
                        <i className="fa-solid fa-bangladeshi-taka-sign"></i>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="limbo-bottom-tabs">
              <button className={activeTab === "manual" ? "active" : ""} onClick={() => setActiveTab("manual")} disabled={isAutoBetting}>{t("Manual", "ম্যানুয়াল")}</button>
              <button className={activeTab === "auto" ? "active" : ""} onClick={() => setActiveTab("auto")} disabled={isAutoBetting}>{t("Auto", "অটো")}</button>
            </div>

            <GameBottomBar 
              onSettingsClick={() => setIsSettingsOpen(true)}
              onStatsClick={() => setIsGraphOpen(true)}
              onFairnessClick={() => { setIsFairnessOpen(true); setFairnessView("main"); }}
            />

          </div>

          {suggestedGames.length > 0 && (
            <div className="suggested-section">
              <h2 className="suggested-title">
                <i className="fa-solid fa-gamepad" style={{ color: '#00E701' }}></i> {t("Suggested Games", "প্রস্তাবিত গেমস")}
              </h2>
              <div className="suggested-grid">
                {suggestedGames.map((game) => (
                  <div 
                    key={game.id} 
                    className="premium-game-card" 
                    style={{ 
                      border: game.show_border !== false ? `2px solid ${game.border_color || '#00E701'}` : 'none' 
                    }}
                    onClick={() => router.push(`/${game.game_link}`)}
                  >
                    <img 
                      src={game.game_image} 
                      alt={game.game_name} 
                      className="premium-card-img"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x400/1B2A23/00E701?text=Game"; }}
                    />
                    <div className="premium-card-overlay"></div>
                    
                    {game.show_ribbon !== false && (
                      <div className="premium-card-ribbon" style={{ backgroundColor: game.ribbon_color || '#00E701', color: '#000' }}>
                        {game.ribbon_text || "SHUFFLE"}
                      </div>
                    )}
                    
                    {game.show_title === true && (
                      <h3 className="premium-card-title">{game.game_name}</h3>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {isSettingsOpen && (
        <div className="limbo-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="limbo-modal-content" onClick={e => e.stopPropagation()}>
            <div className="limbo-modal-header">
              <h3>{t("Settings", "সেটিংস")}</h3>
              <button onClick={() => setIsSettingsOpen(false)}>✕</button>
            </div>
            <div className="limbo-modal-body">
              <div className="limbo-setting-row">
                <span>{t("Instant Bet (Turbo)", "ইনস্ট্যান্ট বেট (টার্বো)")}</span>
                <div className={`toggle-switch ${instantBet ? "active" : ""}`} onClick={() => setInstantBet(!instantBet)}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="limbo-setting-row">
                <span>{t("Sound Effects", "সাউন্ড ইফেক্ট")}</span>
                <div className={`toggle-switch ${soundEnabled ? "active" : ""}`} onClick={() => setSoundEnabled(!soundEnabled)}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <button className="limbo-btn-secondary" style={{ width: '100%', marginTop: '15px' }} onClick={() => { setIsSettingsOpen(false); setIsBetHistoryOpen(true); }}>
                {t("View Bet History", "বেট হিস্ট্রি দেখুন")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBetHistoryOpen && (
        <div className="limbo-modal-overlay" onClick={() => setIsBetHistoryOpen(false)}>
          <div className="limbo-modal-content" onClick={e => e.stopPropagation()}>
            <div className="limbo-modal-header">
              <h3>{t("Bet History", "বেট হিস্ট্রি")}</h3>
              <button onClick={() => setIsBetHistoryOpen(false)}>✕</button>
            </div>
            <div className="limbo-modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa' }}>{t("No bets placed yet.", "এখনো কোনো বেট নেই।")}</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#fff' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #23332b', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>{t("Nonce", "নন্স")}</th>
                      <th style={{ padding: '8px 4px' }}>{t("Multiplier", "মাল্টিপ্লায়ার")}</th>
                      <th style={{ padding: '8px 4px' }}>{t("Result", "ফলাফল")}</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>{t("Profit", "লাভ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px dashed #23332b' }}>
                        <td style={{ padding: '8px 4px', color: '#a0aab2' }}>{h.nonce}</td>
                        <td style={{ padding: '8px 4px' }}>{h.isWin ? `${Number(h.value).toFixed(2)}x` : t("Loss", "হার")}</td>
                        <td style={{ padding: '8px 4px', color: h.isWin ? '#00e701' : '#ff4d4d' }}>{h.isWin ? t("Win", "জয়") : t("Loss", "হার")}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', color: h.profit > 0 ? '#00e701' : '#ff4d4d' }}>
                          {h.profit > 0 ? '+' : ''}{Number(h.profit).toFixed(2)}
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
        <div className="limbo-modal-overlay no-blur" onClick={() => setIsGraphOpen(false)}>
          <div className="limbo-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '240px' }}>
            <div className="limbo-live-stats-header" style={{ padding: '16px 12px 0 12px' }}>
              <div className="limbo-live-stats-title">
                <i className="fa-solid fa-chart-simple" style={{ fontSize: '14px', color: '#a0aab2' }}></i>
                <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>{t("Live Stats", "লাইভ স্ট্যাটস")}</h3>
              </div>
              <div className="limbo-live-stats-icons">
                <button onClick={() => setIsGraphOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div className="limbo-modal-body" style={{ padding: '12px' }}>
              <div className="limbo-stats-main-card">
                <div className="limbo-stats-layout">
                  <div className="limbo-stats-column">
                    <div className="limbo-stat-row-new">
                      <span className="limbo-stat-label-new">{t("Profit", "লাভ")}</span>
                      <span className="limbo-stat-value-new" style={{ color: totalProfit >= 0 ? '#00E701' : '#ff4d4d' }}>{totalProfit >= 0 ? '' : '-'}৳{Math.abs(Number(totalProfit)).toFixed(2)}</span>
                    </div>
                    <div className="limbo-stat-row-new">
                      <span className="limbo-stat-label-new">{t("Wagered", "ওয়েজার্ড")}</span>
                      <span className="limbo-stat-value-new" style={{ color: '#fff' }}>৳{Number(totalWagered).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="limbo-stats-divider"></div>
                  <div className="limbo-stats-column" style={{ paddingLeft: '8px' }}>
                    <div className="limbo-stat-row-new">
                      <span className="limbo-stat-label-new">{t("Wins", "জয়")}</span>
                      <span className="limbo-stat-value-new" style={{ color: '#00E701' }}>{wins}</span>
                    </div>
                    <div className="limbo-stat-row-new">
                      <span className="limbo-stat-label-new">{t("Losses", "হার")}</span>
                      <span className="limbo-stat-value-new" style={{ color: '#ff4d4d' }}>{losses}</span>
                    </div>
                  </div>
                </div>
                <div className="limbo-graph-card-wrapper">
                  <div className="limbo-graph-area-new" ref={graphContainerRef}>{generateGraph()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFairnessOpen && (
        <div className="limbo-modal-overlay" onClick={() => setIsFairnessOpen(false)}>
          <div className="limbo-modal-content" onClick={e => e.stopPropagation()}>
            <div className="limbo-modal-header">
              <h3>{t("Provably Fair", "প্রুভেবলি ফেয়ার")}</h3>
              <button onClick={() => setIsFairnessOpen(false)}>✕</button>
            </div>
            <div className="limbo-modal-body">
              {fairnessView === "main" && (
                <>
                  <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '15px' }}>{t("Mines uses a provably fair system to ensure every grid is completely random.", "মাইনস প্রুভেবলি ফেয়ার সিস্টেম ব্যবহার করে যাতে প্রতিটি গ্রিড সম্পূর্ণ র‍্যান্ডম হয়।")}</p>
                  <div className="limbo-fairness-group"><label>{t("Server Seed (Hashed)", "সার্ভার সিড (হ্যাশড)")}</label><div className="limbo-fairness-input"><code>{serverSeedHash}</code></div></div>
                  <div className="limbo-fairness-group"><label>{t("Client Seed (Editable)", "ক্লায়েন্ট সিড (সম্পাদনযোগ্য)")}</label><div className="limbo-fairness-input"><input type="text" value={clientSeed} readOnly /></div></div>
                  <div className="limbo-fairness-group"><label>{t("Seed Verify Number", "সিড ভেরিফাই নম্বর")}</label><div className="limbo-fairness-input"><code>{nonce}</code></div></div>
                  <div className="limbo-fairness-btn-group">
                    <button className="limbo-btn-secondary" onClick={() => setFairnessView("change_seed")}>{t("Change Seed", "সিড পরিবর্তন")}</button>
                    <button className="limbo-btn-secondary" onClick={() => setFairnessView("verify_seed")}>{t("Verify Seed", "সিড যাচাই")}</button>
                  </div>
                </>
              )}
              {fairnessView === "change_seed" && (
                <>
                  <button className="limbo-back-btn" onClick={() => setFairnessView("main")}><i className="fa-solid fa-arrow-left"></i> {t("Back", "ফিরে যান")}</button>
                  <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '15px' }}>{t("Change Client Seed", "ক্লায়েন্ট সিড পরিবর্তন")}</h4>
                  <div className="limbo-fairness-group"><label>{t("New Client Seed", "নতুন ক্লায়েন্ট সিড")}</label><div className="limbo-fairness-input"><input type="text" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} placeholder={t("Enter new seed", "নতুন সিড লিখুন")} /></div></div>
                  <button className="limbo-btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => { setFairnessView("main"); setIsSeedVerified(false); }}>{t("Save Seed", "সিড সেভ করুন")}</button>
                </>
              )}
              {fairnessView === "verify_seed" && (
                <>
                  <button className="limbo-back-btn" onClick={() => setFairnessView("main")}><i className="fa-solid fa-arrow-left"></i> {t("Back", "ফিরে যান")}</button>
                  <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '15px' }}>{t("Verify Latest Result", "সর্বশেষ ফলাফল যাচাই")}</h4>
                  {latestResult ? (
                    <div className="limbo-verify-result-box">
                      <p>{t("Last Multiplier", "সর্বশেষ মাল্টিপ্লায়ার")}:</p>
                      <h4 style={{ color: latestResult.isWin ? '#00E701' : '#ff4d4d' }}>{latestResult.isWin ? `${Number(latestResult.value).toFixed(2)}x (Win)` : t("Loss", "হার")}</h4>
                      <p style={{ marginTop: '10px' }}>{t("Verify Number", "ভেরিফাই নম্বর")}: <strong>{latestResult.nonce}</strong></p>
                    </div>
                  ) : (
                    <p style={{ color: '#aaa', fontSize: '13px' }}>{t("No bets placed yet to verify.", "যাচাই করার জন্য এখনো কোনো বেট নেই।")}</p>
                  )}
                  <div className="limbo-fairness-group"><label>{t("Server Seed (Hashed)", "সার্ভার সিড (হ্যাশড)")}</label><div className="limbo-fairness-input"><code>{serverSeedHash}</code></div></div>
                  <div className="limbo-fairness-group"><label>{t("Client Seed", "ক্লায়েন্ট সিড")}</label><div className="limbo-fairness-input"><code>{clientSeed}</code></div></div>
                  <button className={`limbo-btn-secondary ${isSeedVerified ? 'verified' : ''}`} style={{ width: '100%', marginTop: '10px', background: isSeedVerified ? '#00e701' : '', color: isSeedVerified ? '#000' : '' }} onClick={() => setIsSeedVerified(true)}>
                    {isSeedVerified ? t("Verified ✓", "ভেরিফাইড ✓") : t("Run Verification", "ভেরিফিকেশন চালান")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
