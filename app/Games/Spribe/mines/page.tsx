"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ চেক করে নিন
import "./mines.css";

type Tile = {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
};

export default function MinesGamePage() {
  const router = useRouter();
  const t = (en: string, bn: string) => en; // Language Placeholder

  // 🔄 Loading Sequence States
  const [loadingText, setLoadingText] = useState("Loading...");
  const [isAppReady, setIsAppReady] = useState(false);

  // প্রোফাইল ও ব্যালেন্স
  const [profile, setProfile] = useState<any>(null);

  // গেম স্টেট
  const [bet, setBet] = useState(1.00);
  const [minesCount, setMinesCount] = useState(3);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>(Array(25).fill({ id: 0, isMine: false, isRevealed: false }).map((_, i) => ({ id: i, isMine: false, isRevealed: false })));
  const [multiplier, setMultiplier] = useState(1.00);
  const [nextMultiplier, setNextMultiplier] = useState(1.10);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto Bet স্টেট
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);

  // মেনু স্টেট
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalHistory, setModalHistory] = useState<any[]>([]);
  
  // 🆕 Mines Selector Dropdown State
  const [isMinesMenuOpen, setIsMinesMenuOpen] = useState(false);

  // 🎵 Web Audio API Sound Effects
  const playSound = (type: 'click' | 'win' | 'lose' | 'explosion') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator(); 
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) { console.log("Audio error", e); }
  };

  // ⏳ Loading Sequence & Data Fetching
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoadingText("Connecting to server...");
    }, 1500);

    const timer2 = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
          if (data) setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsAppReady(true);
      }
    }, 4000);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // মাল্টিপ্লায়ার ক্যালকুলেশন
  const calcMultiplier = (mines: number, revealed: number) => {
    if (revealed === 0) return 1.0;
    let prob = 1.0;
    for (let i = 0; i < revealed; i++) {
      prob = prob * ((25 - mines - i) / (25 - i));
    }
    return Number((0.99 / prob).toFixed(4));
  };

  useEffect(() => {
    if (!isPlaying) {
      const count = isAutoMode && selectedTiles.length > 0 ? selectedTiles.length : 1;
      setNextMultiplier(calcMultiplier(minesCount, count));
    }
  }, [minesCount, isPlaying, isAutoMode, selectedTiles.length]);

  // 🔍 মেনু ওপেন ও ডাটা লোড
  const openModal = async (type: string) => {
    playSound('click');
    setActiveModal(type);
    if (type === 'history') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("original_bets_history")
            .select("created_at, bet_amount, profit, multiplier")
            .eq("user_id", user.id)
            .eq("game_name", "mines")
            .order("created_at", { ascending: false })
            .limit(10);
          if (data) setModalHistory(data);
        }
      } catch (err) { console.error(err); }
    }
  };

  // 🔍 টাইল সিলেক্ট (Auto Mode)
  const toggleTileSelection = (index: number) => {
    if (!isAutoMode || isPlaying) return;
    playSound('click');
    
    setSelectedTiles(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= (25 - minesCount)) return prev; 
      return [...prev, index];
    });
  };

  // 🆕 Handle Mines Count Change
  const handleMinesSelect = (count: number) => {
    if (isPlaying) return;
    setMinesCount(count);
    setIsMinesMenuOpen(false);
    setSelectedTiles([]); // রিসেট সিলেকশন
    playSound('click');
  };

  // 🚀 গেম শুরু
  const startGame = async () => {
    if (isProcessing) return;
    if (isAutoMode && selectedTiles.length === 0) return alert(t("Please select at least 1 tile!", "অন্তত ১টি ঘর সিলেক্ট করুন!"));
    if (bet > profile.balance) return alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));

    setIsProcessing(true);
    playSound('click');
    
    try {
      const { data, error } = await supabase.rpc("start_mines_game", {
        p_bet_amount: bet, p_mines_count: minesCount
      });
      if (error) throw error;

      if (data.success) {
        setGameId(data.game_id);
        setIsPlaying(true);
        setMultiplier(1.00);
        setProfile({ ...profile, balance: data.balance_after });
        setTiles(Array(25).fill({ isMine: false, isRevealed: false }).map((_, i) => ({ id: i, isMine: false, isRevealed: false })));

        if (isAutoMode && selectedTiles.length > 0) {
          autoPlaySelectedTiles(data.game_id, selectedTiles, data.balance_after);
        } else {
          setIsProcessing(false);
        }
      } else { 
        alert(data.error); 
        setIsProcessing(false); 
      }
    } catch (err: any) { 
      alert(err.message); 
      setIsProcessing(false); 
    }
  };

  // 🤖 Auto Play Sequence
  const autoPlaySelectedTiles = async (currentGameId: string, tilesToReveal: number[], currentBalance: number) => {
    let currentBalanceState = currentBalance;
    
    for (let i = 0; i < tilesToReveal.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = tilesToReveal[i];
      
      try {
        const { data, error } = await supabase.rpc("reveal_mines_tile", {
          p_game_id: currentGameId, p_tile_index: index
        });
        if (error) throw error;

        if (data.success) {
          const newTiles = [...tiles];
          newTiles[index].isRevealed = true;

          if (data.is_mine) {
            playSound('explosion');
            setIsPlaying(false); setIsProcessing(false); setSelectedTiles([]);
            const minePositions = data.mines_positions || [];
            setTiles(prev => prev.map((t, i) => ({ ...t, isRevealed: true, isMine: minePositions.includes(i) })));
            return;
          } else {
            playSound('win');
            if (data.revealed) data.revealed.forEach((revIdx: number) => { if (newTiles[revIdx]) newTiles[revIdx].isRevealed = true; });
            setTiles(newTiles);
            setMultiplier(data.multiplier);

            if (data.status === 'won') {
              setIsPlaying(false); setIsProcessing(false); setSelectedTiles([]);
              setProfile({ ...profile, balance: currentBalanceState + (bet * data.multiplier) });
              alert(t(`You won ${(bet * data.multiplier).toFixed(2)} BDT!`, `আপনি জিতেছেন!`));
              return;
            }
          }
        }
      } catch (err) { setIsProcessing(false); return; }
    }
    setIsProcessing(false);
  };

  // 🔍 ম্যানুয়াল বক্স ওপেন
  const revealTile = async (index: number) => {
    if (!isPlaying || tiles[index].isRevealed || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.rpc("reveal_mines_tile", {
        p_game_id: gameId, p_tile_index: index
      });
      if (error) throw error;

      if (data.success) {
        const newTiles = [...tiles];
        newTiles[index].isRevealed = true;

        if (data.is_mine) {
          playSound('explosion');
          setIsPlaying(false); setIsProcessing(false);
          const minePositions = data.mines_positions || [];
          setTiles(prev => prev.map((t, i) => ({ ...t, isRevealed: true, isMine: minePositions.includes(i) })));
        } else {
          playSound('win');
          if (data.revealed) data.revealed.forEach((revIdx: number) => { if (newTiles[revIdx]) newTiles[revIdx].isRevealed = true; });
          setTiles(newTiles);
          setMultiplier(data.multiplier);

          if (data.status === 'won') {
            setIsPlaying(false);
            setProfile({ ...profile, balance: profile.balance + (bet * data.multiplier) });
            alert(t(`You won ${(bet * data.multiplier).toFixed(2)} BDT!`, `আপনি জিতেছেন!`));
          } else {
            const revealedCount = data.revealed ? data.revealed.length : 1;
            setNextMultiplier(calcMultiplier(minesCount, revealedCount + 1));
          }
        }
      }
    } catch (err: any) { console.error(err); } finally { setIsProcessing(false); }
  };

  // 💰 ক্যাশআউট
  const cashout = async () => {
    if (!isPlaying || isProcessing) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("cashout_mines_game", { p_game_id: gameId });
      if (error) throw error;

      if (data.success) {
        playSound('win');
        setIsPlaying(false);
        setProfile({ ...profile, balance: profile.balance + data.payout });
        alert(t(`Cashed out ${data.payout.toFixed(2)} BDT!`, `সফলভাবে টাকা তুলেছেন!`));
        setTiles(prev => prev.map(t => ({ ...t, isRevealed: true })));
      } else { alert(data.error); }
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  const toggleAutoMode = () => {
    if (isPlaying) return;
    playSound('click');
    setIsAutoMode(!isAutoMode);
    setSelectedTiles([]); 
  };

  // ⏳ Loading Screen Render
  if (!isAppReady) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <h2 className="loading-text">{loadingText}</h2>
      </div>
    );
  }

  return (
    <div className="mines-wrapper">
      <main className="game-shell">

        {/* TOP NOTCH */}
        <div className="notch" onClick={() => openModal('main')}>
          ▼
        </div>

        {/* ======================================= */}
        {/* ALL MODALS (Spribe Style) */}
        {/* ======================================= */}
        {activeModal && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              
              {/* ---- MAIN MENU MODAL ---- */}
              {activeModal === 'main' && (
                <div className="modal-inner">
                  <div className="main-menu-header">
                    <span className="phone-num">01953823183</span>
                  </div>
                  
                  <div className="main-menu-list">
                    <div className="menu-row sound-row">
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        <span>{t("Sound", "সাউন্ড")}</span>
                      </div>
                      <div className={`toggle-switch ${soundEnabled ? 'active' : ''}`} onClick={() => setSoundEnabled(!soundEnabled)}>
                        <div className="toggle-knob"></div>
                      </div>
                    </div>

                    <button className="menu-row" onClick={() => openModal('freebets')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        <span>{t("Free Bets", "ফ্রি বেটস")}</span>
                      </div>
                    </button>

                    <button className="menu-row" onClick={() => openModal('history')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{t("Bet History", "বেট হিস্ট্রি")}</span>
                      </div>
                    </button>

                    <button className="menu-row" onClick={() => openModal('limits')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span>{t("Game Limits", "গেম লিমিটস")}</span>
                      </div>
                    </button>

                    <button className="menu-row" onClick={() => openModal('howto')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{t("How to Play", "কিভাবে খেলবেন")}</span>
                      </div>
                    </button>

                    <button className="menu-row" onClick={() => openModal('rules')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>{t("Game Rules", "গেম রুলস")}</span>
                      </div>
                    </button>

                    <button className="menu-row" onClick={() => openModal('provably')}>
                      <div className="menu-row-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                        <span>{t("Provably Fair Settings", "প্রুভেবলি ফেয়ার")}</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="main-menu-footer">
                    <div className="pf-text">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t("Provably Fair Game", "প্রুভেবলি ফেয়ার গেম")}
                    </div>
                    <div className="spribe-logo">© SPRIBE</div>
                  </div>
                </div>
              )}

              {/* ---- HOW TO PLAY MODAL (New Design) ---- */}
              {(activeModal === 'howto' || activeModal === 'rules') && (
                <div className="modal-inner howto-modal">
                  <div className="modal-header">
                    <h2>{t("HOW TO PLAY", "কিভাবে খেলবেন")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  
                  <div className="howto-content">
                    <div className="howto-icon-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4facfe" strokeWidth="2" className="star-icon">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <h3>MINES</h3>
                    </div>

                    {/* Mini Grid for Example */}
                    <div className="howto-example-grid">
                      {[...Array(25)].map((_, i) => {
                        let cellClass = "howto-cell";
                        if (i === 6 || i === 12 || i === 18) cellClass += " star-cell"; // Yellow with star
                        if (i === 8) cellClass += " mine-cell"; // Red with mine
                        
                        return (
                          <div key={i} className={cellClass}>
                            {i === 6 || i === 12 || i === 18 ? (
                              <span className="howto-icon-star">★</span>
                            ) : i === 8 ? (
                              <span className="howto-icon-mine">💥</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <p className="howto-text">
                      {t("Each tile hides either a star or a mine.", "প্রতিটি ঘরে একটি তারা অথবা একটি মাইন লুকিয়ে থাকে।")}
                    </p>
                    <p className="howto-text">
                      {t("Increase the total number of stars for bigger odds and higher rewards. You can cash out after each turn, or try for increased winnings.", "বড় অডস এবং উচ্চতর পুরস্কারের জন্য তারা সংখ্যা বাড়ান। আপনি প্রতিটি টার্নের পরে ক্যাশ আউট করতে পারেন, অথবা বর্ধিত জয়ের চেষ্টা করতে পারেন।")}
                    </p>
                  </div>
                </div>
              )}

              {/* ---- OTHER MODALS (Placeholders) ---- */}
              {activeModal === 'history' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("BET HISTORY", "বেট হিস্ট্রি")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <div className="history-list">
                    {modalHistory.length > 0 ? modalHistory.map((h, i) => (
                      <div key={i} className="history-row">
                        <span>{new Date(h.created_at).toLocaleString()}</span>
                        <span>{Number(h.bet_amount).toFixed(2)} BDT</span>
                        <span className={h.profit > 0 ? "text-green" : "text-white"}>{h.profit > 0 ? `+${Number(h.profit).toFixed(2)}` : "0.00"} BDT</span>
                        <span className={h.profit > 0 ? "text-green" : "text-white"}>{Number(h.multiplier).toFixed(2)}x</span>
                      </div>
                    )) : <div className="text-center py-4 text-gray-400">No records</div>}
                  </div>
                </div>
              )}

              {activeModal !== 'main' && activeModal !== 'history' && activeModal !== 'howto' && activeModal !== 'rules' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{activeModal.toUpperCase()}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <p className="modal-text">
                    This is a demo {activeModal} page. Information will be updated soon.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TOP CONTROLS */}
        <section className="top-controls">
          {/* 🆕 Mines Dropdown Selector */}
          <div 
            className="mines-selector" 
            onClick={() => !isPlaying && setIsMinesMenuOpen(!isMinesMenuOpen)}
            style={{ opacity: isPlaying ? 0.5 : 1, pointerEvents: isPlaying ? 'none' : 'auto' }}
          >
            <span>{t("Mines", "মাইনস")}: {minesCount}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', transform: isMinesMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            
            {/* Dropdown Menu */}
            {isMinesMenuOpen && (
              <div className="mines-dropdown" onClick={(e) => e.stopPropagation()}>
                {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                  <div 
                    key={num} 
                    className={`mines-dropdown-item ${minesCount === num ? 'active' : ''}`}
                    onClick={() => handleMinesSelect(num)}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="next-multiplier">
            {t("Next", "পরবর্তী")}: {nextMultiplier.toFixed(2)}x
          </div>
        </section>

        {/* GAME GRID */}
        <section className="game-area">
          <div className="mines-grid">
            {tiles.map((tile, index) => {
              const isRevealed = tile.isRevealed;
              const isSelected = selectedTiles.includes(index);
              
              return (
                <div 
                  key={index} 
                  className={`mines-tile ${isRevealed ? 'revealed' : ''} ${isRevealed && tile.isMine ? 'mine' : ''} ${isRevealed && !tile.isMine ? 'star' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isAutoMode && !isPlaying) toggleTileSelection(index);
                    else if (!isAutoMode && isPlaying) revealTile(index);
                  }}
                >
                  {!isRevealed && <div className="inner-circle"></div>}
                  {isRevealed && tile.isMine && <span className="icon">💣</span>}
                  {isRevealed && !tile.isMine && <span className="icon">💎</span>}
                  {isSelected && !isPlaying && <div className="selection-tick">✓</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* MIDDLE CONTROLS */}
        <section className="middle-controls">
          <button className="random-btn" onClick={() => {
            if (isAutoMode && !isPlaying) {
              const avail = Array.from({length: 25}, (_, i) => i).filter(i => !selectedTiles.includes(i));
              if (avail.length > 0) toggleTileSelection(avail[Math.floor(Math.random() * avail.length)]);
            }
          }} disabled={isPlaying}>
            {t("RANDOM", "র‍্যান্ডম")}
          </button>
          
          <div className="auto-game-toggle" onClick={toggleAutoMode} style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>{t("Auto Game", "অটো গেম")}</span>
            <div className={`toggle-switch ${isAutoMode ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </section>

        {/* BET PANEL */}
        <section className="bet-panel">
          <div className="bet-action-row">
            <button className="refresh-btn" disabled={isPlaying || isProcessing}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>

            {!isPlaying ? (
              <button className="main-action-btn bet-btn" onClick={startGame} disabled={isProcessing || (isAutoMode && selectedTiles.length === 0)}>
                {isProcessing ? t("WAIT...", "অপেক্ষা...") : (isAutoMode ? t("START BET", "স্টার্ট বেট") : t("BET", "বেট"))}
              </button>
            ) : (
              <button className="main-action-btn cashout-btn" onClick={cashout} disabled={isProcessing}>
                {isProcessing ? t("WAIT...", "অপেক্ষা...") : `${t("CASHOUT", "ক্যাশআউট")} ${(bet * multiplier).toFixed(2)}`}
              </button>
            )}
          </div>

          <div className="bet-input-row" style={{ opacity: isPlaying ? 0.5 : 1, pointerEvents: isPlaying ? 'none' : 'auto' }}>
            <div className="bet-input-wrapper">
              <div className="bet-label">{t("Bet BDT", "বেট BDT")}</div>
              <div className="bet-input">{bet.toFixed(2)}</div>
            </div>
            <button className="round-ctrl" onClick={() => setBet(Math.max(1, bet - 1))} disabled={isPlaying || isProcessing}>−</button>
            <button className="round-ctrl stack" disabled={isPlaying || isProcessing}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button className="round-ctrl" onClick={() => setBet(bet + 1)} disabled={isPlaying || isProcessing}>+</button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="mines-tab">MINES</div>
          <div className="help" onClick={() => openModal('howto')}>?</div>
          <div className="balance">
            {Number(profile?.balance || 0).toFixed(2)} <span>BDT</span>
          </div>
          <button className="menu" onClick={() => openModal('main')}>☰</button>
        </footer>

      </main>
    </div>
  );
}
