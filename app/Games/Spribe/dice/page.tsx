"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ আপনার প্রজেক্ট অনুযায়ী চেক করে নিন
import "./dice.css";

export default function DiceGamePage() {
  const router = useRouter();

  // Language Toggle Placeholder (আপনার প্রজেক্টের গ্লোবাল ফাংশন দিয়ে রিপ্লেস করবেন)
  const t = (en: string, bn: string) => en;

  // প্রোফাইল ও ব্যালেন্স
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // গেম স্টেট
  const [bet, setBet] = useState(1.00);
  const [chance, setChance] = useState(48.5);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  
  // মেনু স্টেট
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalHistory, setModalHistory] = useState<any[]>([]);

  // Provably Fair স্টেট (নতুন)
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [isSeedUpdating, setIsSeedUpdating] = useState(false);

  // হিস্ট্রি স্টেট
  const [historyData, setHistoryData] = useState<any[]>([]);

  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const payout = 99 / chance;
  const highChance = 100 - chance;
  const potentialWin = bet * payout;

  // ডাটা লোড (Provably Fair সিড সহ)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // প্রোফাইল থেকে ব্যালেন্স এবং সিড ডাটা আনা
          const { data } = await supabase
            .from("profiles")
            .select("balance, pf_client_seed, pf_server_seed_hash")
            .eq("id", user.id)
            .single();
            
          if (data) {
            setProfile(data);
            setClientSeed(data.pf_client_seed || "");
            setServerSeedHash(data.pf_server_seed_hash || "");
          }

          // আগের ড্র-এর হিস্ট্রি আনা
          const { data: history } = await supabase
            .from("original_bets_history")
            .select("roll_value, is_win")
            .eq("user_id", user.id)
            .eq("game_name", "dice")
            .order("created_at", { ascending: false })
            .limit(6);

          if (history) {
            setHistoryData(history.map(h => ({
              val: Number(h.roll_value).toFixed(2),
              isGreen: h.is_win
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // মোডাল ওপেন করলে বিস্তারিত হিস্ট্রি লোড করা
  const openModal = async (type: string) => {
    setActiveModal(type);
    if (type === 'history') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("original_bets_history")
            .select("created_at, bet_amount, profit, multiplier")
            .eq("user_id", user.id)
            .eq("game_name", "dice")
            .order("created_at", { ascending: false })
            .limit(20);
          if (data) setModalHistory(data);
        }
      } catch (err) {
        console.error("History fetch error", err);
      }
    }
  };

  // নতুন র্যান্ডম ক্লায়েন্ট সিড জেনারেট করা
  const handleRandomizeClientSeed = async () => {
    if (isSeedUpdating) return;
    setIsSeedUpdating(true);
    try {
      // র্যান্ডম ৩২ অক্ষরের হেক্স স্ট্রিং জেনারেট
      const newSeed = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ pf_client_seed: newSeed })
          .eq("id", user.id);
          
        if (!error) {
          setClientSeed(newSeed);
        } else {
          console.error("Error updating seed:", error);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeedUpdating(false);
    }
  };

  // টেক্সট কপি ফাংশন
  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    // চাইলে এখানে একটি ছোট টোস্ট মেসেজ দিতে পারেন, আপাতত alert দেওয়া হলো
    alert(t("Copied to clipboard!", "কপি করা হয়েছে!"));
  };

  const handleRoll = async (isHigh: boolean) => {
    if (!profile || bet <= 0) return;
    if (bet > profile.balance) {
      alert("Insufficient balance!");
      return;
    }

    setIsRolling(true);
    setIsWin(null);
    setResult(null);

    // অ্যানিমেশন শুরু (১ সেকেন্ড)
    let rollCount = 0;
    animationRef.current = setInterval(() => {
      setResult(Math.random() * 100);
      rollCount++;
    }, 50);

    try {
      // আসল RPC কল
      const { data, error } = await supabase.rpc("play_dice", {
        p_bet_amount: bet,
        p_target: chance,
        p_is_over: isHigh
      });

      if (error) throw error;

      setTimeout(() => {
        if (animationRef.current) clearInterval(animationRef.current);
        
        if (data.success) {
          setResult(Number(data.roll));
          setIsWin(data.is_win);
          setProfile({ ...profile, balance: data.balance_after });
          
          // হিস্ট্রি আপডেট
          setHistoryData(prev => [
            { val: Number(data.roll).toFixed(2), isGreen: data.is_win },
            ...prev
          ].slice(0, 6));
        } else {
          alert(data.error);
          setResult(null);
        }
        setIsRolling(false);
      }, 1000); // ১ সেকেন্ড পর আসল রেজাল্ট দেখাবে

    } catch (err: any) {
      if (animationRef.current) clearInterval(animationRef.current);
      alert(err.message);
      setIsRolling(false);
    }
  };

  if (loading) return <div className="dice-page-wrapper flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dice-page-wrapper">
      <main className="game-shell">

        {/* TOP MENU POPUP (Arrow Notch Menu) */}
        {isMenuOpen && (
          <div className="top-menu-popup">
            <button className="menu-item" onClick={() => router.back()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>{t("Back", "ব্যাক")}</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span>{t("Add", "যোগ")}<br/>{t("Favorite", "প্রিয়")}</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <span>{t("My favorites", "আমার প্রিয়")}</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>{t("Search", "সার্চ")}</span>
            </button>
            <button className="menu-item" onClick={() => router.push('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>{t("Home", "হোম")}</span>
            </button>
            <button className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              <span>{t("Fullscreen", "ফুলস্ক্রিন")}</span>
            </button>
          </div>
        )}

        {/* HISTORY */}
        <section className="history">
          {historyData.length > 0 ? historyData.map((item, idx) => (
            <div key={idx} className={`history-item ${item.isGreen ? "green" : "white"}`}>
              {item.val}
            </div>
          )) : <div className="text-xs text-gray-400 w-full text-center">{t("No History", "কোন হিস্ট্রি নেই")}</div>}
          <button className="history-menu" onClick={() => openModal('history')}>◴⌄</button>
        </section>

        {/* RESULT & GRAPH PANEL */}
        <section className="result-panel">
          
          {/* Menu Arrow (Notch) */}
          <div className="notch" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? "▲" : "▼"}
          </div>

          <div 
            className="result-number" 
            id="result"
            style={{ color: isWin === true ? "#36bd00" : isWin === false ? "#ff4d4d" : (result === null ? "transparent" : "#36bd00") }}
          >
            {result !== null ? result.toFixed(2) : "00.00"}
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
                left: `calc(${result !== null ? result : 0}% - 22px)`,
                right: 'auto',
                top: 'calc(50% - 6px)',
                opacity: result !== null ? 1 : 0
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
              <div className="payout-label">{t("Payout", "পেআউট")}</div>
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
              <div className="small-label">{t("Potential win:", "সম্ভাব্য জয়:")}</div>
              <div className="small-value" id="potential">{potentialWin.toFixed(2)} BDT</div>
            </div>
            <div>
              <span className="small-label">{t("Chance:", "সম্ভাবনা:")}</span>
              <span className="small-value" id="chance">{chance.toFixed(2)} %</span>
            </div>
          </div>
        </section>

        {/* BET AREA */}
        <section className="bet-area">
          <div className="action-row">
            
            {/* Rebet / Roll Button */}
            <button className="action-btn roll" id="roll" onClick={() => handleRoll(false)} disabled={isRolling}>
              <svg style={{ width: '28px', height: '28px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

          <div className="bet-row">
            <div className="bet-input-wrapper">
              <div className="bet-label">{t("Bet BDT", "বেট BDT")}</div>
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
          <div className="help" onClick={() => openModal('howto')}>?</div>
          <div className="balance">
            {Number(profile?.balance || 0).toFixed(2)} <span>BDT</span>
          </div>
          <button className="menu" onClick={() => openModal('main')}>☰</button>
        </footer>

        {/* ======================================= */}
        {/* ALL MODALS OVERLAY */}
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
                        <span>{t("Provably Fair Settings", "প্রুভেবলি ফেয়ার সেটিংস")}</span>
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

              {/* ---- BET HISTORY MODAL ---- */}
              {activeModal === 'history' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("BET HISTORY", "বেট হিস্ট্রি")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <div className="history-table-header">
                    <span>{t("Time", "সময়")}</span>
                    <span>{t("Bet", "বেট")}</span>
                    <span>{t("Cash out", "ক্যাশ আউট")}</span>
                    <span>X</span>
                  </div>
                  <div className="history-list">
                    {modalHistory.length > 0 ? modalHistory.map((h, i) => (
                      <div key={i} className="history-row">
                        <span className="text-gray">{new Date(h.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{Number(h.bet_amount).toFixed(2)} BDT</span>
                        <span className={h.profit > 0 ? "text-green" : "text-white"}>{h.profit > 0 ? `+${Number(h.profit).toFixed(2)}` : "0.00"} BDT</span>
                        <span className={h.profit > 0 ? "text-green" : "text-white"}>{Number(h.multiplier).toFixed(2)}x</span>
                      </div>
                    )) : (
                      <div className="text-center text-gray py-4">{t("No records found", "কোন রেকর্ড নেই")}</div>
                    )}
                  </div>
                  {modalHistory.length > 0 && (
                    <button className="load-more-btn">{t("load more", "আরো লোড করুন")}</button>
                  )}
                </div>
              )}

              {/* ---- GAME LIMITS MODAL ---- */}
              {activeModal === 'limits' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("GAME LIMITS", "গেম লিমিটস")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <p className="modal-desc">
                    {t("Game limits are managed by operator. Current game limits for this game are below:", "গেম লিমিট অপারেটর দ্বারা পরিচালিত হয়। এই গেমের বর্তমান সীমা নিচে দেওয়া হলো:")}
                  </p>
                  <div className="limit-row">
                    <span>{t("Maximum bet BDT:", "সর্বোচ্চ বেট BDT:")}</span>
                    <span className="limit-badge">10,000.00</span>
                  </div>
                  <div className="limit-row">
                    <span>{t("Minimum bet BDT:", "সর্বনিম্ন বেট BDT:")}</span>
                    <span className="limit-badge">1.00</span>
                  </div>
                  <div className="limit-row">
                    <span>{t("Maximum win for one bet BDT:", "এক বেটে সর্বোচ্চ জয় BDT:")}</span>
                    <span className="limit-badge">1,000,000.00</span>
                  </div>
                </div>
              )}

              {/* ---- HOW TO PLAY MODAL ---- */}
              {activeModal === 'howto' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("HOW TO PLAY", "কিভাবে খেলবেন")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <div className="howto-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <h3>DICE</h3>
                  </div>
                  <p className="modal-text">
                    {t("The dice will roll a number ranging from 0.00 to 99.99.", "ডাইস 0.00 থেকে 99.99 এর মধ্যে একটি সংখ্যা রোল করবে।")}
                  </p>
                  <p className="modal-text">
                    {t("Set your odds using the payout bar, then bet whether the next roll will be under or over your set figure.", "পেআউট বার ব্যবহার করে আপনার অডস সেট করুন, তারপর পরবর্তী রোলটি আপনার সেট করা সংখ্যার নিচে বা উপরে হবে কিনা তা বাজি ধরুন।")}
                  </p>
                </div>
              )}

              {/* ---- GAME RULES MODAL ---- */}
              {activeModal === 'rules' && (
                <div className="modal-inner scrollable-modal">
                  <div className="modal-header">
                    <h2>{t("GAME RULES", "গেম রুলস")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <div className="howto-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <h3>DICE</h3>
                  </div>
                  <ul className="rules-list">
                    <li>{t("Dice is a quick and straightforward game with fast gameplay and instant results;", "ডাইস একটি দ্রুত এবং সহজ গেম যেখানে দ্রুত গেমপ্লে এবং তাত্ক্ষণিক ফলাফল রয়েছে;")}</li>
                    <li>{t("A goal of the player is to guess, will the next outcome be over or under of selected number;", "খেলোয়াড়ের লক্ষ্য হল অনুমান করা, পরবর্তী ফলাফলটি নির্বাচিত সংখ্যার উপরে বা নিচে হবে কিনা;")}</li>
                    <li>{t("Player can bet to roll under set number (green button) or to roll over set number (blue button). If prediction was correct, win amount will be the bet amount multiplied by payout multiplier;", "প্লেয়ার সেট সংখ্যার নিচে রোল করতে (সবুজ বাটন) বা সেট সংখ্যার উপরে রোল করতে (নীল বাটন) বাজি ধরতে পারে। যদি ভবিষ্যদ্বাণী সঠিক হয়, জয়ের পরিমাণ হবে বাজির পরিমাণ পেআউট গুণক দ্বারা গুণিত;")}</li>
                    <li>{t("Set number and odds of the game can be changed by dragging payout line or entering custom payout multiplier;", "পেআউট লাইন টেনে বা কাস্টম পেআউট গুণক প্রবেশ করে গেমের সেট সংখ্যা এবং অডস পরিবর্তন করা যাবে;")}</li>
                    <li>{t("Outcomes of previous rounds are appearing in the “Last results” section, on top of the target number;", "পূর্ববর্তী রাউন্ডের ফলাফলগুলি টার্গেট নম্বরের উপরে 'সর্বশেষ ফলাফল' বিভাগে উপস্থিত হয়;")}</li>
                  </ul>
                </div>
              )}

              {/* ---- PROVABLY FAIR MODAL (Real Data Connected) ---- */}
              {activeModal === 'provably' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("PROVABLY FAIR SETTINGS", "প্রুভেবলি ফেয়ার সেটিংস")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <p className="modal-desc">
                    {t("This game uses Provably Fair technology to determine game result. This tool gives you ability to change your seed and check fairness of the game.", "এই গেমটি গেমের ফলাফল নির্ধারণ করতে প্রুভেবলি ফেয়ার প্রযুক্তি ব্যবহার করে। এই টুলটি আপনাকে আপনার সিড পরিবর্তন করতে এবং গেমের ন্যায্যতা পরীক্ষা করার ক্ষমতা দেয়।")}
                  </p>
                  <a href="#" className="green-link">{t("What is Provably Fair", "প্রুভেবলি ফেয়ার কি")}</a>
                  
                  <div className="pf-box">
                    <div className="pf-box-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <div>
                        <strong>{t("Next client seed:", "পরবর্তী ক্লায়েন্ট সিড:")}</strong>
                        <span>{t("Generated on Your side", "আপনার দিক থেকে জেনারেট করা হয়েছে")}</span>
                      </div>
                    </div>
                    <div className="pf-radio-group">
                      <label><input type="radio" name="seed" defaultChecked /> {t("Random on every new game", "প্রতিটি নতুন গেমে র‍্যান্ডম")}</label>
                      <label><input type="radio" name="seed" /> {t("Add nonce", "নন্স যোগ করুন")}</label>
                    </div>
                    <div className="pf-input-group">
                      <input type="text" readOnly value={clientSeed || "Loading..."} />
                      <button className="pf-icon-btn" onClick={() => handleCopyText(clientSeed)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button className="pf-icon-btn" onClick={handleRandomizeClientSeed} disabled={isSeedUpdating}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isSeedUpdating ? "animate-spin" : ""}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="pf-box">
                    <div className="pf-box-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                      <div>
                        <strong>{t("Next server seed SHA256:", "পরবর্তী সার্ভার সিড SHA256:")}</strong>
                        <span>{t("Encrypted seed, generated on our side", "এনক্রিপ্টেড সিড, আমাদের দিক থেকে জেনারেট করা হয়েছে")}</span>
                      </div>
                    </div>
                    <div className="pf-input-group">
                      <input type="text" readOnly value={serverSeedHash || "Loading..."} />
                      <button className="pf-icon-btn" onClick={() => handleCopyText(serverSeedHash)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- FREE BETS MODAL (Placeholder) ---- */}
              {activeModal === 'freebets' && (
                <div className="modal-inner">
                  <div className="modal-header">
                    <h2>{t("FREE BETS", "ফ্রি বেটস")}</h2>
                    <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
                  </div>
                  <div className="text-center py-8 text-gray-400">
                    {t("No free bets available at the moment.", "এই মুহূর্তে কোন ফ্রি বেট নেই।")}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
