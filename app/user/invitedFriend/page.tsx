"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./invitedFriend.css";

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

      // ১. প্রোফাইল ডাটা
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, game_id, bonus_balance, referral_earnings")
        .eq("id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // ২. রেফারেল হিস্ট্রি (নতুন টেবিল)
      const { data: referData } = await supabase
        .from("user_invited_friend_referral")
        .select("*")
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
    if (amount > Number(profile.bonus_balance)) {
      setMessage({ type: "error", text: t("Insufficient bonus balance.", "পর্যাপ্ত বোনাস নেই।") });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // ১. বোনাস ব্যালেন্স থেকে কেটে মেইন ব্যালেন্সে যোগ করা
      const newBonusBalance = Number(profile.bonus_balance) - amount;
      const newMainBalance = Number(profile.balance || 0) + amount; // নিশ্চিত করুন balance কলামটি সিলেক্ট করেছেন

      // এখানে একটি ট্রানজ্যাকশন দরকার হতে পারে, তবে আপাতত সরাসরি আপডেট
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          bonus_balance: newBonusBalance,
          balance: newMainBalance 
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, bonus_balance: newBonusBalance });
      setMessage({ type: "success", text: t("Transfer successful!", "ট্রান্সফার সফল হয়েছে!") });
      setShowTransferModal(false);
      setTransferAmount("");
      loadData(); // রিফ্রেশ

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
      <div className="invite-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#263C32] border-t-[#00E701] rounded-full animate-spin"></div>
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
                <strong className="text-[#f58220]">{pendingClaims}</strong>
              </div>
              <div className="invite-stat-card">
                <span>{t("Earnings", "আর্নিংস")}</span>
                <strong className="text-[#00E701]">৳ {Number(profile.referral_earnings).toFixed(2)}</strong>
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
                <span>{t("Bonus Wallet Balance", "বোনাস ওয়ালেট ব্যালেন্স")}</span>
                <strong>৳ {Number(profile.bonus_balance).toFixed(2)}</strong>
              </div>
              <button 
                className="invite-transfer-btn"
                onClick={() => {
                  if (Number(profile.bonus_balance) <= 0) {
                    setMessage({ type: "error", text: t("No bonus available to transfer.", "ট্রান্সফার করার মতো বোনাস নেই।") });
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
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      <div>
                        <strong>{t("New User Referred", "নতুন ইউজার রেফারেল")}</strong>
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
              <h3>{t("Transfer Bonus", "বোনাস ট্রান্সফার")}</h3>
              <button onClick={() => setShowTransferModal(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleTransferRequest}>
              <p className="text-[#A0ADB0] text-xs mb-4">
                {t("Enter the amount you want to transfer to your main balance.", "আপনি মেইন ব্যালেন্সে যত টাকা ট্রান্সফার করতে চান তা লিখুন।")}
              </p>
              
              <div className="invite-input-group">
                <label>{t("Amount", "পরিমাণ")} (Max: ৳{Number(profile.bonus_balance).toFixed(2)})</label>
                <input 
                  type="number" 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={t("Enter amount", "পরিমাণ লিখুন")}
                  max={profile.bonus_balance}
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
