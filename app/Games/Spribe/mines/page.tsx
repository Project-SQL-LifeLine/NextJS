"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // আপনার পাথ অনুযায়ী চেক করে নিন
import "./mines.css";

type Tile = {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
};

export default function MinesGamePage() {
  const router = useRouter();

  // Language Toggle Placeholder
  const t = (en: string, bn: string) => en;

  // প্রোফাইল ও ব্যালেন্স
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // গেম স্টেট
  const [bet, setBet] = useState(1.00);
  const [minesCount, setMinesCount] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [multiplier, setMultiplier] = useState(1.00);
  const [nextMultiplier, setNextMultiplier] = useState(1.10);
  const [isAutoGame, setIsAutoGame] = useState(false);

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
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'lose') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.log("Audio error", e);
    }
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

  // মাইনস কাউন্ট পরিবর্তন হলে পরবর্তী মাল্টিপ্লায়ার আপডেট (ডেমো লজিক)
  useEffect(() => {
    if (!isPlaying) {
      // ডেমো ফর্মুলা: ২৫ টির মধ্যে কয়টি মাইন আছে তার ওপর ভিত্তি করে
      const safeSquares = 25 - minesCount;
      const baseMultiplier = 25 / safeSquares;
      setNextMultiplier(baseMultiplier);
    }
  }, [minesCount, isPlaying]);

  // গেম শুরু
  const startGame = () => {
    if (!profile || bet <= 0) return;
    if (bet > profile.balance) {
      alert(t("Insufficient balance!", "পর্যাপ্ত ব্যালেন্স নেই!"));
      return;
    }

    playSound('click');
    setIsPlaying(true);
    setMultiplier(1.00);
    setProfile({ ...profile, balance: profile.balance - bet }); // ডেমো ব্যালেন্স কাটা

    // ডেমো বোমা জেনারেট (পরবর্তীতে Supabase RPC থেকে আসবে)
    const newTiles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
    }));

    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
      const randomIndex = Math.floor(Math.random() * 25);
      if (!newTiles[randomIndex].isMine) {
        newTiles[randomIndex].isMine = true;
        minesPlaced++;
      }
    }
    setTiles(newTiles);
  };

  // বক্স ওপেন করা
  const revealTile = (id: number) => {
    if (!isPlaying) return;
    const tile = tiles[id];
    if (tile.isRevealed) return;

    playSound('click');
    const newTiles = [...tiles];
    newTiles[id].isRevealed = true;
    setTiles(newTiles);

    if (tile.isMine) {
      // বোমায় পড়েছে
      playSound('lose');
      setIsPlaying(false);
      alert(t("BOOM! You hit a mine.", "বোমা! আপনি হেরে গেছেন।"));
      // সব বোমা দেখানো
      setTiles(prev => prev.map(t => ({ ...t, isRevealed: true })));
    } else {
      // কয়েন পেয়েছে (মাল্টিপ্লায়ার বাড়বে)
      const safeSquares = 25 - minesCount;
      const revealedSafe = newTiles.filter(t => t.isRevealed && !t.isMine).length;
      // ডেমো ক্যালকুলেশন
      const newMultiplier = multiplier * (25 / (safeSquares - revealedSafe + 1));
      setMultiplier(newMultiplier);
      
      const nextSafeSquares = safeSquares - revealedSafe;
      if (nextSafeSquares > 0) {
        setNextMultiplier(newMultiplier * (25 / nextSafeSquares));
      } else {
        // সব কয়েন খুঁজে পেয়েছে
        cashout(true);
      }
    }
  };

  // ক্যাশআউট
  const cashout = (auto = false) => {
    if (!isPlaying) return;
    playSound('win');
    setIsPlaying(false);
    const winAmount = bet * multiplier;
    setProfile({ ...profile, balance: profile.balance + winAmount });
    if (!auto) alert(t(`You cashed out ${winAmount.toFixed(2)} BDT!`, `আপনি ${winAmount.toFixed(2)} টাকা তুলেছেন!`));
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
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span>{t("Add Favorite", "প্রিয় তালিকায়")}</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{t("Bet History", "বেট হিস্ট্রি")}</span>
            </button>
            <button className="menu-item" onClick={() => setSoundEnabled(!soundEnabled)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              <span>{soundEnabled ? t("Sound On", "সাউন্ড অন") : t("Sound Off", "সাউন্ড অফ")}</span>
            </button>
          </div>
        )}

        {/* TOP CONTROLS (Mines Dropdown & Next Multiplier) */}
        <section className="top-controls">
          <div className="mines-selector">
            <span>{t("Mines", "মাইনস")}: {minesCount}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="next-multiplier">
            {t("Next", "পরবর্তী")}: {nextMultiplier.toFixed(2)}x
          </div>
        </section>

        {/* GAME GRID (5x5) */}
        <section className="game-area">
          <div className="mines-grid">
            {tiles.map((tile, index) => {
              // খেলা না চললে সব বক্স লক থাকবে
              const showReveal = isPlaying || (!isPlaying && tile.isRevealed); 
              
              return (
                <div 
                  key={index} 
                  className={`mines-tile ${tile.isRevealed ? 'revealed' : ''} ${tile.isRevealed && tile.isMine ? 'mine' : ''} ${tile.isRevealed && !tile.isMine ? 'star' : ''}`}
                  onClick={() => revealTile(index)}
                >
                  {!showReveal && <div className="inner-circle"></div>}
                  {tile.isRevealed && tile.isMine && <span className="icon">💣</span>}
                  {tile.isRevealed && !tile.isMine && <span className="icon">💎</span>}
                </div>
              );
            })}
            {/* যদি গেম শুরু না হয় তবে ডামি ২৫টি বক্স দেখানোর জন্য */}
            {tiles.length === 0 && Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="mines-tile">
                <div className="inner-circle"></div>
              </div>
            ))}
          </div>
        </section>

        {/* MIDDLE CONTROLS */}
        <section className="middle-controls">
          <button className="random-btn" disabled={isPlaying}>
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
            <button className="refresh-btn" disabled={isPlaying}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>

            {!isPlaying ? (
              <button className="main-action-btn bet-btn" onClick={startGame}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}><path d="M8 5v14l11-7z" /></svg>
                {t("BET", "বেট")}
              </button>
            ) : (
              <button className="main-action-btn cashout-btn" onClick={() => cashout(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
                {t("CASHOUT", "ক্যাশআউট")} {(bet * multiplier).toFixed(2)}
              </button>
            )}
          </div>

          <div className="bet-input-row">
            <div className="bet-input-wrapper">
              <div className="bet-label">{t("Bet BDT", "বেট BDT")}</div>
              <div className="bet-input">{bet.toFixed(2)}</div>
            </div>
            
            <button className="round-ctrl" onClick={() => setBet(Math.max(1, bet - 1))} disabled={isPlaying}>−</button>
            <button className="round-ctrl stack" disabled={isPlaying}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button className="round-ctrl" onClick={() => setBet(bet + 1)} disabled={isPlaying}>+</button>
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
