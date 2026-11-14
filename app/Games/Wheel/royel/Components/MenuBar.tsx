"use client";

import { useState, useEffect } from "react";
import "./MenuBar.css";

const t = (en: string, bn: string) => en; // আপনি চাইলে বাংলা অনুবাদও দিতে পারেন

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

  // মেনুর বাইরে ক্লিক করলে মেনু বন্ধ হয়ে যাবে
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

  // গ্লোবাল ফাংশন যা মোডালের ভেতরের HTML থেকে কল করা হবে
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

  const handleHistory = () => {
    if (!recentResults.length) {
      onOpenModal(t("HISTORY", "হিস্ট্রি"), `<p class="modal-text">${t("No results available yet.", "এখনো কোনো রেজাল্ট নেই।")}</p>`);
    } else {
      const html = `<div class="history-list">${recentResults.map((r) => `
        <div class="history-item" style="background:${r.color}">
          ${r.number}<small>${r.multiplier}X</small>
        </div>`).join("")}</div>`;
      onOpenModal(t("RESULT HISTORY", "রেজাল্ট হিস্ট্রি"), html);
    }
    setIsOpen(false);
  };

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
        <div className="mb-title">LUCKY ROYALE</div>
        
        <button className="mb-option" onClick={handleHistory}>
          <span>◷ &nbsp; {t("History", "হিস্ট্রি")}</span>
        </button>
        
        <button className="mb-option" onClick={handlePayoutLimit}>
          <span>💰 &nbsp; {t("Payout Limit", "পেআউট লিমিট")}</span>
        </button>
        
        <button className="mb-option" onClick={handleFairness}>
          <span>♧ &nbsp; {t("Fairness", "ফেয়ারনেস")}</span>
        </button>
        
        <button className="mb-option" onClick={onToggleSound}>
          <span>🔊 &nbsp; {t("Sound", "সাউন্ড")}</span>
          <span className={`badge ${isSoundOn ? "on" : ""}`}>{isSoundOn ? "ON" : "OFF"}</span>
        </button>
        
        <button className="mb-option" onClick={handlePolicy}>
          <span>⚠️ &nbsp; {t("Policy's", "পলিসি")}</span>
        </button>
      </div>
    </div>
  );
}
