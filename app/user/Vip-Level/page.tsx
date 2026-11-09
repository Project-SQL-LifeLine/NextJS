"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./vip-level.css";
import "./vip-level-loader.css";

export default function VipLevelPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [timeClaims, setTimeClaims] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Accordion State
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  // Form & Message State
  const [transferAmount, setTransferAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // কাউন্টডাউন টাইমার আপডেট করার জন্য স্টেট
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // প্রতি সেকেন্ডে টাইমার আপডেট হবে
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/user/login");
        return;
      }

      setIsLoggedIn(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      const { data: levelsData } = await supabase
        .from("vip_level_settings_amount_control")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (levelsData) setVipLevels(levelsData);

      const { data: claimsData } = await supabase
        .from("user_vip_level_amount_claims_history")
        .select("vip_level_id")
        .eq("user_id", user.id);

      if (claimsData) {
        setClaimedLevels(claimsData.map(c => c.vip_level_id));
      }

      const { data: timeClaimsData } = await supabase
        .from("user_vip_time_bonus_claims")
        .select("bonus_type, claimed_at")
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false });

      if (timeClaimsData) {
        const claimsMap: any = {};
        timeClaimsData.forEach((c) => {
          if (!claimsMap[c.bonus_type]) {
            claimsMap[c.bonus_type] = c.claimed_at;
          }
        });
        setTimeClaims(claimsMap);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleClaimLevelUp = async (levelId: number) => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("claim_vip_level_bonus", {
        p_level_id: levelId
      });

      if (error) throw error;

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        loadData();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimTimeBonus = async (bonusType: string) => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("claim_vip_time_bonus", {
        p_bonus_type: bonusType
      });

      if (error) throw error;

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        loadData();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // টাইম বোনাস স্ট্যাটাস (কাউন্টডাউন টাইমারসহ)
  const getTimeBonusStatus = (type: string, requiredHours: number) => {
    const lastClaim = timeClaims[type];
    if (!lastClaim) return { canClaim: true, timeLeft: "" };

    const lastClaimDate = new Date(lastClaim).getTime();
    const nextClaimTime = lastClaimDate + requiredHours * 60 * 60 * 1000;

    if (currentTime >= nextClaimTime) {
      return { canClaim: true, timeLeft: "" };
    }

    const diff = nextClaimTime - currentTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { 
      canClaim: false, 
      timeLeft: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` 
    };
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("transfer_vip_bonus_to_main", {
        p_amount: Number(transferAmount)
      });

      if (error) throw error;

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setTransferAmount("");
        loadData();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="vip-loader-container">
        <svg className="vip-loader-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    );
  }

  const currentLevelId = profile?.current_vip_level || 0;
  const currentLevelData = vipLevels.find(v => v.id === currentLevelId);
  const nextLevelData = vipLevels.find(v => v.id === currentLevelId + 1);
  
  const currentWager = Number(profile?.total_vip_wager) || 0;
  const nextWagerReq = nextLevelData ? Number(nextLevelData.required_wager) : currentWager;
  
  let progressPercent = 100;
  if (nextLevelData) {
    progressPercent = Math.min((currentWager / nextWagerReq) * 100, 100);
  }

  const dailyStatus = getTimeBonusStatus("daily", 24);
  const weeklyStatus = getTimeBonusStatus("weekly", 168);
  const monthlyStatus = getTimeBonusStatus("monthly", 720);

  // টায়ার অনুযায়ী লেভেল গ্রুপ করা
  const tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Obsidian"];

  return (
    <div className="vip-page pb-20">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="vip-main">
        <h1 className="vip-title">
          <svg className="w-6 h-6 text-[#f58220]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          VIP Program
        </h1>

        {message.text && (
          <div className={`fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4`} onClick={() => setMessage({ type: "", text: "" })}>
            <div className={`bg-[#1C2A24] border ${message.type === 'success' ? 'border-[#00E701] text-[#00E701]' : 'border-[#ff4d4d] text-[#ff4d4d]'} p-5 rounded-xl shadow-2xl text-center min-w-[200px]`}>
              <p className="font-bold text-sm m-0">{message.text}</p>
            </div>
          </div>
        )}

        <div className="vip-status-card">
          <div className="vip-tier-name">{currentLevelData?.tier_name || "No Tier"}</div>
          <div className="vip-current-level">{currentLevelData?.level_name || "Unranked"}</div>
          
          <div className="vip-progress-container">
            <div className="vip-progress-text">
              <span>৳ {currentWager.toLocaleString()}</span>
              <span>{nextLevelData ? `৳ ${nextWagerReq.toLocaleString()}` : "Max Level"}</span>
            </div>
            <div className="vip-progress-bar-bg">
              <div className="vip-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* ৫টি বোনাস বাটনের গ্রিড (কাউন্টডাউন সহ) */}
        <div className="vip-grid-buttons">
          
          {/* ১. Instant Rakeback */}
          <div className="vip-grid-card">
            <span className="vip-btn-icon">💰</span>
            <span className="vip-btn-title">Instant Rakeback</span>
            <span className="vip-btn-value">৳{Number(profile?.unclaimed_rakeback || 0).toFixed(2)}</span>
            {Number(profile?.unclaimed_rakeback) > 0 ? (
              <button onClick={() => handleClaimTimeBonus("instant_rakeback")} className="vip-mini-claim-btn" disabled={submitting}>
                Claim
              </button>
            ) : (
              <span className="vip-wait-text">No Rakeback</span>
            )}
          </div>

          {/* ২. Daily Bonus */}
          <div className="vip-grid-card">
            <span className="vip-btn-icon">📅</span>
            <span className="vip-btn-title">Daily Bonus</span>
            <span className="vip-btn-value">৳{Number(currentLevelData?.daily_bonus_amount || 0).toFixed(2)}</span>
            {dailyStatus.canClaim ? (
              <button onClick={() => handleClaimTimeBonus("daily")} className="vip-mini-claim-btn" disabled={submitting}>
                Claim
              </button>
            ) : (
              <span className="vip-timer">{dailyStatus.timeLeft}</span>
            )}
          </div>

          {/* ৩. Weekly Bonus */}
          <div className="vip-grid-card">
            <span className="vip-btn-icon">📆</span>
            <span className="vip-btn-title">Weekly Bonus</span>
            <span className="vip-btn-value">৳{Number(currentLevelData?.weekly_bonus_amount || 0).toFixed(2)}</span>
            {weeklyStatus.canClaim ? (
              <button onClick={() => handleClaimTimeBonus("weekly")} className="vip-mini-claim-btn" disabled={submitting}>
                Claim
              </button>
            ) : (
              <span className="vip-timer">{weeklyStatus.timeLeft}</span>
            )}
          </div>

          {/* ৪. Monthly Bonus */}
          <div className="vip-grid-card">
            <span className="vip-btn-icon">🗓️</span>
            <span className="vip-btn-title">Monthly Bonus</span>
            <span className="vip-btn-value">৳{Number(currentLevelData?.monthly_bonus_amount || 0).toFixed(2)}</span>
            {monthlyStatus.canClaim ? (
              <button onClick={() => handleClaimTimeBonus("monthly")} className="vip-mini-claim-btn" disabled={submitting}>
                Claim
              </button>
            ) : (
              <span className="vip-timer">{monthlyStatus.timeLeft}</span>
            )}
          </div>

          {/* ৫. Level Up Bonus */}
          <div className="vip-grid-card">
            <span className="vip-btn-icon">⭐</span>
            <span className="vip-btn-title">Level Up Bonus</span>
            <span className="vip-btn-value">৳{Number(currentLevelData?.bonus_amount || 0).toFixed(2)}</span>
            <span className="vip-wait-text">View Levels Below</span>
          </div>

        </div>

        <div className="vip-bonus-card">
          <div className="vip-bonus-row">
            <span>VIP Bonus Balance</span>
            <strong>৳ {Number(profile?.vip_bonus_balance || 0).toFixed(2)}</strong>
          </div>
          <p className="text-[10px] text-[#A0ADB0] mb-3">
            Transfer to main balance will require 1x turnover.
          </p>
          <form onSubmit={handleTransfer} className="vip-transfer-box">
            <input 
              type="number" 
              placeholder="Enter amount" 
              className="vip-transfer-input" 
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              max={profile?.vip_bonus_balance || 0}
            />
            <button type="submit" className="vip-btn-3d" disabled={submitting || Number(profile?.vip_bonus_balance) <= 0}>
              Transfer
            </button>
          </form>
        </div>

        {/* Accordion VIP Level List */}
        <h2 className="text-[14px] text-white font-bold mb-3 mt-6">All VIP Levels</h2>
        <div className="vip-tier-list">
          {tiers.map((tier) => {
            const tierLevels = vipLevels.filter((level) => level.tier_name === tier);
            if (tierLevels.length === 0) return null;

            return (
              <div key={tier} className="vip-tier-group">
                <button 
                  className="vip-tier-header"
                  onClick={() => setExpandedTier(expandedTier === tier ? null : tier)}
                >
                  <span>{tier}</span>
                  <svg className={`w-5 h-5 transition-transform ${expandedTier === tier ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedTier === tier && (
                  <div className="vip-tier-content">
                    {tierLevels.map((level) => {
                      const isClaimed = claimedLevels.includes(level.id);
                      const isUnlocked = currentLevelId >= level.id;

                      return (
                        <div key={level.id} className={`vip-level-item ${isUnlocked ? "" : "locked"} ${currentLevelId === level.id ? "current" : ""}`}>
                          <div className="vip-level-info">
                            <h4>{level.level_name}</h4>
                            <p>Wager: ৳ {Number(level.required_wager).toLocaleString()}</p>
                          </div>
                          <div>
                            {isClaimed ? (
                              <span className="text-[11px] text-[#00E701] font-bold">Claimed</span>
                            ) : isUnlocked ? (
                              <button onClick={() => handleClaimLevelUp(level.id)} className="vip-btn-3d" disabled={submitting}>
                                Claim ৳{level.bonus_amount}
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#A0ADB0]">Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
