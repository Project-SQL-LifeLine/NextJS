"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./invitedFriend.css";
import "./invitedFriend-loader.css";

export default function InviteFriendPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ট্রান্সফার স্টেট
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const basePath = process.env.NODE_ENV === "production" ? "/NextJS" : "";

  const loadData = useCallback(async () => {
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
        .select("id, game_id, balance, referral_earnings")
        .eq("id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // profiles টেবিল থেকে game_id জয়েন করা হয়েছে
      const { data: referData } = await supabase
        .from("user_invited_friend_referral")
        .select(`
          *,
          referred:referred_user_id (game_id)
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      
      if (referData) setReferrals(referData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  // গেম আইডি মাস্ক করার ফাংশন (যেমন: MD****88)
  const maskGameId = (gameId: string) => {
    if (!gameId) return "N/A";
    const id = gameId.toUpperCase();
    if (id.length <= 4) return id;
    return `${id.slice(0, 2)}****${id.slice(-2)}`;
  };

  const copyReferralLink = () => {
    if (!profile) return;
    const link = `${window.location.origin}${basePath}/user/signup/?ref=${profile.game_id}`;
    navigator.clipboard.writeText(link);
    setMessage({ type: "success", text: t("Referral link copied!", "রেফারেল লিংক কপি হয়েছে!") });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: t("Please enter a valid amount.", "সঠিক পরিমাণ লিখুন।") });
      return;
    }
    if (amount > Number(profile.referral_earnings)) {
      setMessage({ type: "error", text: t("Insufficient referral earnings.", "পর্যাপ্ত রেফারেল আর্নিংস নেই।") });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const newReferralEarnings = Number(profile.referral_earnings) - amount;
      const newMainBalance = Number(profile.balance || 0) + amount;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          referral_earnings: newReferralEarnings,
          balance: newMainBalance 
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, referral_earnings: newReferralEarnings });
      setMessage({ type: "success", text: t("Transfer successful!", "ট্রান্সফার সফল হয়েছে!") });
      setShowTransferModal(false);
      setTransferAmount("");
      loadData();

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return <span className="badge pending">{t("Pending", "অপেক্ষমাণ")}</span>;
    if (s === "approved") return <span className="badge approved">{t("Approved", "অনুমোদিত")}</span>;
    if (s === "rejected") return <span className="badge rejected">{t("Rejected", "বাতিল")}</span>;
    return <span className="badge">{status}</span>;
  };

  if (loading) {
    return (
      <div className="invite-loader-container">
        <svg 
          className="invite-loader-svg" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
          />
        </svg>
      </div>
    );
  }

  const totalReferrals = referrals.length;
  const pendingClaims = referrals.filter(r => r.status === "pending").length;

  return (
    <div className="invite-page pb-20">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="invite-main">
        <h1 className="invite-title">{t("Invite Friends", "বন্ধুদের আমন্ত্রণ জানান")}</h1>

        {message.text && (
          <div className={`invite-alert ${message.type}`}>{message.text}</div>
        )}

        {profile && (
          <>
            {/* Stats */}
            <div className="invite-stats-grid">
              <div className="invite-stat-card">
                <span>{t("Total Referrals", "মোট রেফারেল")}</span>
                <strong>{totalReferrals}</strong>
              </div>
              <div className="invite-stat-card">
                <span>{t("Pending", "অপেক্ষমাণ")}</span>
                <strong style={{ color: '#f58220' }}>{pendingClaims}</strong>
              </div>
              <div className="invite-stat-card">
                <span>{t("Earnings", "আর্নিংস")}</span>
                <strong className="text-white">৳ {Number(profile.referral_earnings).toFixed(2)}</strong>
              </div>
            </div>

            {/* Referral Link */}
            <div className="invite-link-card">
              <h3>{t("Your Referral Link", "আপনার রেফারেল লিংক")}</h3>
              <p>{t("Share this link with your friends and earn commission.", "এই লিংকটি বন্ধুদের সাথে শেয়ার করুন এবং কমিশন আয় করুন।")}</p>
              <div className="invite-link-box">
                <input 
                  type="text" 
                  readOnly 
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/user/signup/?ref=${profile.game_id}`} 
                />
                <button onClick={copyReferralLink}>
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  {t("Copy", "কপি")}
                </button>
              </div>
            </div>

            {/* Bonus Wallet */}
            <div className="invite-bonus-card">
              <div>
                <span>{t("Referral Earnings", "রেফারেল আর্নিংস")}</span>
                <strong className="text-white">৳ {Number(profile.referral_earnings).toFixed(2)}</strong>
              </div>
              <button 
                className="invite-transfer-btn"
                onClick={() => {
                  if (Number(profile.referral_earnings) <= 0) {
                    setMessage({ type: "error", text: t("No earnings available to transfer.", "ট্রান্সফার করার মতো আর্নিংস নেই।") });
                    return;
                  }
                  setShowTransferModal(true);
                }}
              >
                {t("Transfer to Main", "মেইন ব্যালেন্সে ট্রান্সফার")}
              </button>
            </div>

            {/* Referral History */}
            <h2 className="invite-section-title">{t("Referral History", "রেফারেল হিস্ট্রি")}</h2>
            {referrals.length === 0 ? (
              <div className="invite-empty">
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <p>{t("No referrals yet. Share your link to get started!", "এখনও কোনো রেফারেল নেই। লিংক শেয়ার করা শুরু করুন!")}</p>
              </div>
            ) : (
              <div className="invite-list">
                {referrals.map(r => (
                  <div className="invite-item" key={r.id}>
                    <div className="invite-item-left">
                      {/* প্রিমিয়াম সাদা SVG */}
                      <div className="premium-svg-box">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <strong>{maskGameId(r.referred?.game_id)}</strong>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="invite-item-right">
                      <span className="invite-amount">+ ৳{Number(r.bonus_amount).toFixed(2)}</span>
                      {getStatusBadge(r.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {/* Transfer Modal */}
      {showTransferModal && profile && (
        <div className="invite-modal-overlay">
          <div className="invite-modal">
            <div className="invite-modal-header">
              <h3>{t("Transfer Earnings", "আর্নিংস ট্রান্সফার")}</h3>
              <button onClick={() => setShowTransferModal(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleTransferRequest}>
              <p className="text-[#A0ADB0] text-[11px] mb-4">
                {t("Enter the amount you want to transfer to your main balance.", "আপনি মেইন ব্যালেন্সে যত টাকা ট্রান্সফার করতে চান তা লিখুন।")}
              </p>
              
              <div className="invite-input-group">
                <label>{t("Amount", "পরিমাণ")} (Max: ৳{Number(profile.referral_earnings).toFixed(2)})</label>
                <input 
                  type="number" 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={t("Enter amount", "পরিমাণ লিখুন")}
                  max={profile.referral_earnings}
                  required
                />
              </div>

              <button type="submit" className="invite-modal-submit" disabled={submitting}>
                {submitting ? t("Processing...", "প্রসেসিং...") : t("Submit", "সাবমিট")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
