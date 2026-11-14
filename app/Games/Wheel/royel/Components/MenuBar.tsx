"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client"; 
import Link from "next/link"; 
import "./MenuBar.css";

const t = (en: string, bn: string) => en;

interface MenuBarProps {
  recentResults: any[];
  onOpenModal: (title: string, content: string, isFullScreen?: boolean) => void; // 👈 isFullScreen যোগ হলো
  isSoundOn: boolean;
  onToggleSound: () => void;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  onChangeClientSeed: (newSeed: string) => void;
  onOpenStats: () => void; 
  onShowRecent: () => void;
}

export default function MenuBar({
  recentResults,
  onOpenModal,
  isSoundOn,
  onToggleSound,
  clientSeed,
  serverSeedHash,
  nonce,
  onChangeClientSeed,
  onOpenStats,
  onShowRecent,
}: MenuBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".mb-wrapper")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    (window as any).saveClientSeed = (newSeed: string) => {
      if (!newSeed.trim()) return;
      onChangeClientSeed(newSeed.trim());
      
      const input = document.getElementById("client-seed-input") as HTMLInputElement;
      if(input) input.value = newSeed.trim();

      const btn = document.getElementById("save-seed-btn");
      if (btn) {
        btn.textContent = "Seed Changed!";
        btn.style.background = "#35e59a";
        setTimeout(() => {
          btn.textContent = "Generate New Seed";
          btn.style.background = "#F5C451";
        }, 2000);
      }
    };

    (window as any).copyBetId = (id: string) => {
      if (!id) return;
      navigator.clipboard.writeText(id).then(() => {
        const el = document.getElementById(`copy-${id}`);
        if (el) {
          el.innerHTML = "✔️";
          setTimeout(() => { el.innerHTML = "📋"; }, 1500);
        }
      });
    };

    return () => { 
      delete (window as any).saveClientSeed; 
      delete (window as any).copyBetId;
    };
  }, [onChangeClientSeed]);

  const handleHistory = async () => {
    setIsOpen(false);
    setLoadingHistory(true);
    
    // 👇 isFullScreen = true পাস করা হচ্ছে 👇
    onOpenModal("BETTING HISTORY", `<p class="modal-text" style="text-align:center;">${t("Loading...", "লোড হচ্ছে...")}</p>`, true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onOpenModal("BETTING HISTORY", `<p class="modal-text">Please login to view history.</p>`, true);
        return;
      }

      const { data, error } = await supabase
        .from('original_bets_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_name', 'wheel')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (!data || data.length === 0) {
        onOpenModal("BETTING HISTORY", `<p class="modal-text" style="text-align:center;">No history found.</p>`, true);
        return;
      }

      const html = data.map(row => {
        const isWin = row.profit > 0;
        const isLoss = row.profit < 0;
        const profitColor = isWin ? '#35e59a' : (isLoss ? '#ff6868' : '#F5C451');
        const profitText = isWin ? `+৳${row.profit}` : (isLoss ? `-৳${Math.abs(row.profit)}` : '৳0');
        
        const winNum = row.game_data?.winner_number || '—';
        const winMult = row.game_data?.winner_multiplier || '—';
        const betsData = row.game_data?.bets || [];
        
        const betsHtml = betsData.map((b:any) => `<span style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:6px; margin:3px; display:inline-block; font-size:11px;">${b.number} (৳${b.amount})</span>`).join("");

        const betId = row.bet_id || 'N/A';

        return `
          <div class="history-full-item">
            <div class="hfi-header">
              <div class="hfi-id" onclick="window.copyBetId('${betId}')" title="Copy ID">
                <span>ID: ${betId}</span>
                <span id="copy-${betId}" style="margin-left:5px; cursor:pointer;">📋</span>
              </div>
              <div class="hfi-profit" style="color:${profitColor}">
                ${profitText}
              </div>
            </div>
            
            <div class="hfi-details">
              <div class="hfi-col">
                <span class="hfi-label">Winner</span>
                <span class="hfi-val" style="color:#FFD76A;">${winNum} (${winMult}X)</span>
              </div>
              <div class="hfi-col">
                <span class="hfi-label">Total Bet</span>
                <span class="hfi-val">৳${row.bet_amount}</span>
              </div>
              <div class="hfi-col">
                <span class="hfi-label">Balance After</span>
                <span class="hfi-val">৳${Number(row.balance_after).toFixed(2)}</span>
              </div>
            </div>

            <div class="hfi-bets">
              <span class="hfi-label" style="margin-bottom:4px; display:block;">Your Bets:</span>
              <div style="display: flex; flex-wrap: wrap;">${betsHtml}</div>
            </div>
          </div>
        `;
      }).join("");

      onOpenModal("BETTING HISTORY", `<div class="history-full-list">${html}</div>`, true);
      
    } catch (err) {
      console.error(err);
      onOpenModal("ERROR", `<p class="modal-text" style="color:#ff4d4d">Failed to load history.</p>`, true);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePayoutLimit = () => {
    onOpenModal(t("PAYOUT LIMIT", "পেআউট লিমিট"), `
      <div class="modal-text">
        <p style="margin-bottom:10px;"><strong>1.5% House Fee:</strong> A 1.5% fee is applied to all winning payouts.</p>
        <p style="margin-bottom:10px;"><strong>Dynamic Safe Pool:</strong> To ensure platform stability, the maximum payout and bet limits are dynamically adjusted based on the current round's total bets.</p>
        <p><strong>System Protection:</strong> Bets that exceed the safe limit may have their win probability dynamically adjusted by the system to protect the house edge.</p>
      </div>
    `);
    setIsOpen(false);
  };

  const handleFairness = () => {
    const autoNewSeed = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    
    const html = `
      <div class="modal-text">
        <p><strong>Server Seed Hash:</strong><br/>
          <span style="word-break:break-all; font-size:10px; color:#a9c4b3; background:#0d241e; padding:4px; display:block; border-radius:4px; margin-top:4px;">${serverSeedHash || "Loading..."}</span>
        </p>
        <p style="margin-top:15px;"><strong>Client Seed:</strong><br/>
           <input type="text" id="client-seed-input" value="${clientSeed}" readonly style="width:100%; padding:8px; margin:5px 0; border-radius:5px; border:1px solid #fff; background:#0d241e; color:#fff; font-size:11px; box-sizing:border-box; opacity: 0.8;"/>
           <button id="save-seed-btn" onclick="window.saveClientSeed('${autoNewSeed}')" style="padding:6px 12px; background:#F5C451; color:#000; border-radius:4px; font-weight:bold; font-size:11px; margin-top:5px; cursor:pointer; border:none;">Generate New Seed</button>
        </p>
        <p style="margin-top:15px;"><strong>Current Nonce:</strong> ${nonce}</p>
        <p style="margin-top:15px; font-size:10px; color:#a9c4b3;">The result is generated using HMAC-SHA256(Client Seed : Nonce, Server Seed).</p>
      </div>
    `;
    onOpenModal(t("FAIRNESS & SEEDS", "ফেয়ারনেস ও সিড"), html);
    setIsOpen(false);
  };

  const handlePolicy = () => {
    onOpenModal(t("POLICY & WARNINGS", "পলিসি ও সতর্কতা"), `
      <div class="modal-text" style="color:#ffb3b3;">
        <h4 style="color:#ff4d4d; margin-bottom:8px;">Strict Anti-Fraud Policy</h4>
        <ul style="padding-left:15px; margin-bottom:10px; line-height:1.5;">
          <li style="margin-bottom:5px;">Any attempt to manipulate the game using external software, bots, scripts, or exploiting system bugs is strictly prohibited.</li>
          <li style="margin-bottom:5px;">Using VPNs or proxies to bypass regional restrictions or multi-accounting is not allowed.</li>
          <li>If an account is found violating these rules, the account will be immediately terminated and all balances will be forfeited without prior notice.</li>
        </ul>
        <p style="color:#a9c4b3; font-size:10px; margin-top:10px;">Play responsibly. Gambling can be addictive.</p>
      </div>
    `);
    setIsOpen(false);
  };

  return (
    <div className="mb-wrapper">
      <button
        className={`mb-toggle-btn ${isOpen ? "active" : ""}`}
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 6h16"></path>
          <path d="M4 12h16"></path>
          <path d="M4 18h16"></path>
        </svg>
      </button>

      <div className={`mb-panel ${isOpen ? "open" : ""}`}>
        
        <Link 
          href="/" 
          className="mb-option" 
          style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "8px" }}
          onClick={() => setIsOpen(false)}
        >
          <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px", stroke: "#fff", fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span style={{ fontWeight: "700" }}>{t("Home", "হোম")}</span>
        </Link>

        <Link 
          href="/wallets/voucher-center" 
          className="mb-option" 
          style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          onClick={() => setIsOpen(false)}
        >
          <span style={{ fontWeight: "900", color: "#F5C451" }}>{t("Deposit", "ডিপোজিট")}</span>
          <span style={{ fontSize: "10px", color: "#a9c4b3" }}>Voucher</span>
        </Link>

        <button className="mb-option" onClick={handleHistory}>
          <span>{t("History", "হিস্ট্রি")}</span>
        </button>

        <div style={{ display: 'flex', gap: '5px', margin: '4px 0' }}>
          <button className="mb-option" style={{ flex: 1, padding: '12px 10px' }} onClick={() => { setIsOpen(false); onShowRecent(); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#fff', fill: 'none', strokeWidth: 2 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{t("Recent", "সাম্প্রতিক")}</span>
            </div>
          </button>
          
          <button className="mb-option" style={{ flex: 1.5, padding: '12px 10px' }} onClick={() => { setIsOpen(false); onOpenStats(); }}>
            <span>{t("Statistics", "পরিসংখ্যান")}</span>
          </button>
        </div>
        
        <button className="mb-option" onClick={handlePayoutLimit}>
          <span>{t("Payout Limit", "পেআউট লিমিট")}</span>
        </button>
        
        <button className="mb-option" onClick={handleFairness}>
          <span>{t("Fairness", "ফেয়ারনেস")}</span>
        </button>
        
        <button className="mb-option" onClick={onToggleSound}>
          <span>{t("Sound", "সাউন্ড")}</span>
          <div className={`mb-switch ${isSoundOn ? "on" : ""}`}></div>
        </button>
        
        <button className="mb-option" onClick={handlePolicy}>
          <span>{t("Policy's", "পলিসি")}</span>
        </button>
      </div>
    </div>
  );
}
