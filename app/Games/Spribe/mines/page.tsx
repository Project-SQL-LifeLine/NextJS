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

  // প্রোফাইল ও ব্যালেন্স
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // গেম স্টেট
  const [bet, setBet] = useState(1.00);
  const [minesCount, setMinesCount] = useState(3);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>(Array(25).fill({ id: 0, isMine: false, isRevealed: false }).map((_, i) => ({ id: i, isMine: false, isRevealed: false })));
  const [multiplier, setMultiplier] = useState(1.00);
  const [nextMultiplier, setNextMultiplier] = useState(1.10);
  const [isProcessing, setIsProcessing] = useState(false);

  // অটো গেম স্টেট
  const [isAutoGame, setIsAutoGame] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // মেনু স্টেট
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 🎵 Web Audio API সাউন্ড ইফেক্ট
  const playSound = (type: 'click' | 'win' | 'lose') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'win') {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'lose') {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'click') {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) { console.log("Audio error", e); }
  };

  // ডাটা লোড
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
          if (data) setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // মাল্টিপ্লায়ার ক্যালকুলেশন (ফ্রন্টএন্ডে দেখানোর জন্য)
  const calcMultiplier = (mines: number, revealed: number) => {
    if (revealed === 0) return 1.0;
    let prob = 1.0;
    for (let i = 0; i < revealed; i++) {
      prob = prob * ((25 - mines - i) / (25 - i));
    }
    return Number((0.99 / prob).toFixed(4));
  };

  // পরবর্তী মাল্টিপ্লায়ার আপডেট
  useEffect(() => {
    if (!isPlaying) {
      setNextMultiplier(calcMultiplier(minesCount, 1));
    }
  }, [minesCount, isPlaying]);

  // 🚀 গেম শুরু (RPC)
  const startGame = async () => {
    if (isProcessing) return;
    if (bet > profile.balance) return alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));

    setIsProcessing(true);
    playSound('click');
    
    try {
      const { data, error } = await supabase.rpc("start_mines_game", {
        p_bet_amount: bet,
        p_mines_count: minesCount
      });

      if (error) throw error;

      if (data.success) {
        setGameId(data.game_id);
        setIsPlaying(true);
        setMultiplier(1.00);
        setProfile({ ...profile, balance: data.balance_after });
        setTiles(Array(25).fill({ isMine: false, isRevealed: false }).map((_, i) => ({ id: i, isMine: false, isRevealed: false })));
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔍 বক্স ওপেন (RPC)
  const revealTile = async (index: number) => {
    if (!isPlaying || tiles[index].isRevealed || isProcessing) return;
    setIsProcessing(true);
    playSound('click');

    try {
      const { data, error } = await supabase.rpc("reveal_mines_tile", {
        p_game_id: gameId,
        p_tile_index: index
      });

      if (error) throw error;

      if (data.success) {
        const newTiles = [...tiles];
        newTiles[index].isRevealed = true;

        if (data.is_mine) {
          // বোমায় পড়েছে
          playSound('lose');
          setIsPlaying(false);
          setIsAutoGame(false);
          
          // সব বোমা দেখানো
          const minePositions = data.mines_positions || [];
          setTiles(prev => prev.map((t, i) => ({ ...t, isRevealed: true, isMine: minePositions.includes(i) })));
        } else {
          // কয়েন পেয়েছে
          playSound('win');
          
          // আগের রিভিল করা টাইলগুলো আপডেট করা
          if (data.revealed) {
            data.revealed.forEach((revIdx: number) => {
              if (newTiles[revIdx]) newTiles[revIdx].isRevealed = true;
            });
          }
          setTiles(newTiles);
          setMultiplier(data.multiplier);

          if (data.status === 'won') {
            setIsPlaying(false);
            setIsAutoGame(false);
            setProfile({ ...profile, balance: profile.balance + (bet * data.multiplier) });
            alert(t(`You won ${(bet * data.multiplier).toFixed(2)} BDT!`, `আপনি ${(bet * data.multiplier).toFixed(2)} টাকা জিতেছেন!`));
          } else {
            // পরবর্তী মাল্টিপ্লায়ার আপডেট
            const revealedCount = data.revealed ? data.revealed.length : 1;
            setNextMultiplier(calcMultiplier(minesCount, revealedCount + 1));
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 💰 ক্যাশআউট (RPC)
  const cashout = async () => {
    if (!isPlaying || isProcessing) return;
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc("cashout_mines_game", {
        p_game_id: gameId
      });

      if (error) throw error;

      if (data.success) {
        playSound('win');
        setIsPlaying(false);
        setIsAutoGame(false);
        setProfile({ ...profile, balance: profile.balance + data.payout });
        alert(t(`Cashed out ${data.payout.toFixed(2)} BDT!`, `সফলভাবে ${data.payout.toFixed(2)} টাকা তুলেছেন!`));
        
        // বোর্ড রিসেট
        setTiles(prev => prev.map(t => ({ ...t, isRevealed: true })));
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🤖 Auto Game লজিক
  useEffect(() => {
    if (isAutoGame && isPlaying && !isProcessing) {
      autoPlayRef.current = setTimeout(() => {
        // খালি বক্সগুলো খুঁজে বের করা
        const unrevealedIndices = tiles.map((t, i) => (!t.isRevealed ? i : -1)).filter(i => i !== -1);
        
        if (unrevealedIndices.length > 0) {
          // র‍্যান্ডম একটি বক্স সিলেক্ট করা
          const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
          revealTile(randomIndex);
        }
      }, 800); // প্রতি ৮০০ মিলিসেকেন্ড পর পর একটি বক্স খুলবে
    }
    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [isAutoGame, isPlaying, isProcessing, tiles]);

  // 🎲 Random বাটন লজিক
  const handleRandomPick = () => {
    if (!isPlaying || isProcessing) return;
    const unrevealedIndices = tiles.map((t, i) => (!t.isRevealed ? i : -1)).filter(i => i !== -1);
    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      revealTile(randomIndex);
    }
  };

  if (loading) return <div className="mines-wrapper flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="mines-wrapper">
      <main className="game-shell">

        {/* TOP MENU POPUP (Notch) */}
        <div className="notch" onClick={() => setActiveModal(activeModal ? null : 'main')}>
          {activeModal === 'main' ? "▲" : "▼"}
        </div>

        {activeModal === 'main' && (
          <div className="top-menu-popup">
            <button className="menu-item" onClick={() => router.back()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>{t("Back", "ব্যাক")}</span>
            </button>
            <button className="menu-item" onClick={() => setSoundEnabled(!soundEnabled)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              <span>{soundEnabled ? t("Sound On", "সাউন্ড অন") : t("Sound Off", "সাউন্ড অফ")}</span>
            </button>
          </div>
        )}

        {/* TOP CONTROLS */}
        <section className="top-controls">
          <div className="mines-selector" style={{ opacity: isPlaying ? 0.5 : 1, pointerEvents: isPlaying ? 'none' : 'auto' }}>
            <span>{t("Mines", "মাইনস")}: {minesCount}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            {/* ড্রপডাউন লজিক (পরবর্তীতে যোগ হবে) */}
          </div>
          <div className="next-multiplier">
            {t("Next", "পরবর্তী")}: {nextMultiplier.toFixed(2)}x
          </div>
        </section>

        {/* GAME GRID (5x5) */}
        <section className="game-area">
          <div className="mines-grid">
            {tiles.map((tile, index) => {
              const isRevealed = tile.isRevealed;
              return (
                <div 
                  key={index} 
                  className={`mines-tile ${isRevealed ? 'revealed' : ''} ${isRevealed && tile.isMine ? 'mine' : ''} ${isRevealed && !tile.isMine ? 'star' : ''}`}
                  onClick={() => revealTile(index)}
                >
                  {!isRevealed && <div className="inner-circle"></div>}
                  {isRevealed && tile.isMine && <span className="icon">💣</span>}
                  {isRevealed && !tile.isMine && <span className="icon">💎</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* MIDDLE CONTROLS */}
        <section className="middle-controls">
          <button className="random-btn" onClick={handleRandomPick} disabled={!isPlaying || isProcessing}>
            {t("RANDOM", "র‍্যান্ডম")}
          </button>
          
          <div className="auto-game-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>{t("Auto Game", "অটো গেম")}</span>
            <div className={`toggle-switch ${isAutoGame ? 'active' : ''}`} onClick={() => setIsAutoGame(!isAutoGame)}>
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
              <button className="main-action-btn bet-btn" onClick={startGame} disabled={isProcessing}>
                {isProcessing ? t("WAIT...", "অপেক্ষা করুন...") : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}><path d="M8 5v14l11-7z" /></svg>
                    {t("BET", "বেট")}
                  </>
                )}
              </button>
            ) : (
              <button className="main-action-btn cashout-btn" onClick={cashout} disabled={isProcessing}>
                {isProcessing ? t("WAIT...", "অপেক্ষা করুন...") : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
                    {t("CASHOUT", "ক্যাশআউট")} {(bet * multiplier).toFixed(2)}
                  </>
                )}
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
          <div className="help" onClick={() => alert("How to play mines")}>?</div>
          <div className="balance">
            {Number(profile?.balance || 0).toFixed(2)} <span>BDT</span>
          </div>
          <button className="menu" onClick={() => setActiveModal('main')}>☰</button>
        </footer>

      </main>
    </div>
  );
}
