"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client"; // Supabase ইমপোর্ট করা হলো
import "./MenuBar.css";

const t = (en: string, bn: string) => en;

interface MenuBarProps {
  recentResults: any[];
  onOpenModal: (title: string, content: string) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  onChangeClientSeed: (newSeed: string) => void;
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
      const btn = document.getElementById("save-seed-btn");
      if (btn) {
        btn.textContent = "Saved!";
        btn.style.background = "#35e59a";
      }
    };
    return () => { delete (window as any).saveClientSeed; };
  }, [onChangeClientSeed]);

  // ================= HISTORY LOGIC =================
  const fetchHistoryData = async (limit: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('original_bets_history')
        .select('id, bet_amount, profit, game_data, created_at')
        .eq('user_id', user.id)
        .eq('game_name', 'wheel')
        .order('created_at', { ascending: false })
        .limit(limit + 1); // limit+1 ফেচ করব, যাতে বোঝা যায় আরও ডাটা আছে কি না

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching history:", err);
      return [];
    }
  };

  const generateHistoryHTML = (data: any[], hasMore: boolean, currentLimit: number) => {
    if (data.length === 0) {
      return `<p class="modal-text" style="text-align:center;">${t("No history found.", "কোনো হিস্ট্রি পাওয়া যায়নি।")}</p>`;
    }

    const items = data.map(row => {
      const winnerNum = row.game_data?.winner_number || '—';
      const winnerMult = row.game_data?.winner_multiplier || '—';
      const isWin = row.profit > 0;
      const profitColor = isWin ? '#35e59a' : (row.profit < 0 ? '#ff6868' : '#F5C451');
      const profitText = isWin ? `+৳${row.profit}` : `৳${row.profit}`;
      
      const date = new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="history-row">
          <div class="history-info">
            <div class="history-num-box" style="border-color:${winnerNum % 2 === 0 ? '#55b982' : '#e45b55'}">
               <span class="h-num">${winnerNum}</span>
               <span class="h-mult">${winnerMult}X</span>
            </div>
            <div class="history-details">
               <span class="h-bet">Bet: ৳${row.bet_amount}</span>
               <span class="h-time">${date}</span>
            </div>
          </div>
          <div class="history-result" style="color:${profitColor}">
            ${profitText}
          </div>
        </div>
      `;
    }).join("");

    // বাটনগুলো তৈরি করা
    let buttonsHTML = "";
    if (currentLimit > 10) {
      buttonsHTML += `<button id="history-less-btn" class="history-btn">Show Less</button>`;
    }
    if (hasMore) {
      buttonsHTML += `<button id="history-more-btn" class="history-btn primary">Load More</button>`;
    }

    return `
      <div class="full-history-list">${items}</div>
      <div class="history-actions">${buttonsHTML}</div>
    `;
  };

  const handleHistory = async () => {
    setIsOpen(false);
    setLoadingHistory(true);
    onOpenModal(t("HISTORY", "হিস্ট্রি"), `<p class="modal-text" style="text-align:center;">${t("Loading...", "লোড হচ্ছে...")}</p>`);

    const loadHistory = async (limit: number) => {
      const rawData = await fetchHistoryData(limit);
      const hasMore = rawData.length > limit;
      const displayData = hasMore ? rawData.slice(0, limit) : rawData;

      const html = generateHistoryHTML(displayData, hasMore, limit);
      onOpenModal(t("BETTING HISTORY", "বেটিং হিস্ট্রি"), html);
      setLoadingHistory(false);

      // মোডাল ওপেন হওয়ার পর ইনজেক্ট করা বাটনগুলোতে ক্লিক ইভেন্ট অ্যাড করা
      setTimeout(() => {
        const moreBtn = document.getElementById('history-more-btn');
        if (moreBtn) {
          moreBtn.onclick = () => {
            onOpenModal(t("HISTORY", "হিস্ট্রি"), `<p class="modal-text" style="text-align:center;">${t("Loading...", "লোড হচ্ছে...")}</p>`);
            loadHistory(limit + 10);
          };
        }

        const lessBtn = document.getElementById('history-less-btn');
        if (lessBtn) {
          lessBtn.onclick = () => {
            onOpenModal(t("HISTORY", "হিস্ট্রি"), `<p class="modal-text" style="text-align:center;">${t("Loading...", "লোড হচ্ছে...")}</p>`);
            loadHistory(10);
          };
        }
      }, 50); // DOM আপডেট হওয়ার জন্য সামান্য সময় দেওয়া হলো
    };

    await loadHistory(10);
  };
  // =================================================

  const handlePayoutLimit = () => {
    onOpenModal(t("PAYOUT LIMIT", "পেআউট লিমিট"), `
      <div class="modal-text">
        <p style="margin-bottom:10px;"><strong>1.5% House Fee:</strong> A 1.5% fee is applied to all winning payouts.</p>
        <p style="margin-bottom:10px;"><strong>Dynamic Safe Pool:</strong> To ensure platform stability, the maximum payout and bet limits are dynamically adjusted based on the current round's total bets.</p>
        <p><strong>System Protection:</strong> Bets that exceed the safe limit may have their win probability dynamically adjusted by the system to protect the house edge. This ensures a fair and continuous gaming experience for all players.</p>
      </div>
    `);
    setIsOpen(false);
  };

  const handleFairness = () => {
    const html = `
      <div class="modal-text">
        <p><strong>Server Seed Hash:</strong><br/>
          <span style="word-break:break-all; font-size:10px; color:#a9c4b3; background:#0d241e; padding:4px; display:block; border-radius:4px; margin-top:4px;">${serverSeedHash || "Loading..."}</span>
        </p>
        <p style="margin-top:15px;"><strong>Client Seed (Editable):</strong><br/>
           <input type="text" id="client-seed-input" value="${clientSeed}" style="width:100%; padding:8px; margin:5px 0; border-radius:5px; border:1px solid #fff; background:#0d241e; color:#fff; font-size:11px; box-sizing:border-box;"/>
           <button id="save-seed-btn" onclick="window.saveClientSeed(document.getElementById('client-seed-input').value)" style="padding:6px 12px; background:#F5C451; color:#000; border-radius:4px; font-weight:bold; font-size:11px; margin-top:5px; cursor:pointer; border:none;">Change Seed</button>
        </p>
        <p style="margin-top:15px;"><strong>Current Nonce:</strong> ${nonce}</p>
        <p style="margin-top:15px; font-size:10px; color:#a9c4b3;">The result is generated using HMAC-SHA256(Client Seed : Nonce, Server Seed). You can verify your results.</p>
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
        <p style="color:#a9c4b3; font-size:10px; margin-top:10px;">Play responsibly. Gambling can be addictive. This is a real-money platform.</p>
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
        <button className="mb-option" onClick={handleHistory}>
          <span>{t("History", "হিস্ট্রি")}</span>
        </button>
        
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
