"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./tips.css";
import "./tips-loader.css"; // নতুন লোডার ইমপোর্ট

export default function TipsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Form state
  const [receiverGameId, setReceiverGameId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/user/login");
        return;
      }

      setIsLoggedIn(true);

      // ১. প্রোফাইল ডাটা
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // ২. টিপ হিস্ট্রি
      const { data: historyData } = await supabase
        .from("user_tip_send_history")
        .select(`
          *,
          sender:sender_id(game_id),
          receiver:receiver_id(game_id)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (historyData) setHistory(historyData);
      
      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverGameId || !amount) return;

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("request_tip", {
        p_receiver_game_id: receiverGameId.trim(),
        p_amount: Number(amount)
      });

      if (error) throw error;

      if (data && data.success) {
        setMessage({ type: "success", text: t(data.message, "টিপ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করার পর টাকা যোগ হবে।") });
        setReceiverGameId("");
        setAmount("");
        
        // হিস্ট্রি রিফ্রেশ
        const { data: { user } } = await supabase.auth.getUser();
        const { data: historyData } = await supabase
          .from("user_tip_send_history")
          .select(`*, sender:sender_id(game_id), receiver:receiver_id(game_id)`)
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order("created_at", { ascending: false });
        if (historyData) setHistory(historyData);
        
        // প্রোফাইল রিফ্রেশ
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
        if (profileData) setProfile(profileData);

      } else {
        setMessage({ type: "error", text: data?.error || t("Failed to send tip.", "টিপ পাঠানো ব্যর্থ হয়েছে।") });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("An error occurred.", "একটি সমস্যা হয়েছে।") });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // নতুন টিপ বেইজড সাদা লোডিং এনিমেশন
  // ==========================================
  if (loading) {
    return (
      <div className="tips-loader-container">
        <svg 
          className="tips-loader-svg" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
    );
  }

  const getBadge = (status: string) => {
    if (status === "approved") return <span className="badge approved">{t("Approved", "অনুমোদিত")}</span>;
    if (status === "rejected") return <span className="badge rejected">{t("Rejected", "বাতিল")}</span>;
    return <span className="badge pending">{t("Pending", "অপেক্ষমাণ")}</span>;
  };

  return (
    <div className="tips-page pb-20">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="tips-main">
        
        {/* টিপ পাঠানোর কার্ড */}
        <div className="tips-card">
          <h2>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t("Send Tip", "টিপ পাঠান")}
          </h2>
          <p className="tips-desc">
            {t("Enter your friend's Game ID and amount to send a tip. Admin will verify and approve it.", "আপনার বন্ধুর গেম আইডি এবং পরিমাণ লিখে টিপ পাঠান। অ্যাডমিন ভেরিফাই করে অ্যাপ্রুভ করলে টাকা যোগ হবে।")}
          </p>

          <form className="tips-form" onSubmit={handleSendTip}>
            
            {/* ১. Receiver Game ID (Label সরানো হয়েছে এবং Placeholder আপডেট করা হয়েছে) */}
            <div className="tips-input-group">
              <input 
                type="text" 
                placeholder={t("Receiver Game ID", "রিসিভারের গেম আইডি")}
                value={receiverGameId}
                onChange={(e) => setReceiverGameId(e.target.value)}
                required
              />
            </div>
            
            {/* ২. Amount (Label সরানো হয়েছে এবং Placeholder আপডেট করা হয়েছে) */}
            <div className="tips-input-group">
              <input 
                type="number" 
                placeholder={t("Amount (৳)", "পরিমাণ (৳)")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            {message.text && (
              <div className={`tips-alert ${message.type}`}>{message.text}</div>
            )}

            <button type="submit" className="tips-submit-btn" disabled={submitting}>
              {submitting ? t("Sending...", "পাঠানো হচ্ছে...") : t("Send Tip Request", "টিপ রিকোয়েস্ট পাঠান")}
            </button>
          </form>
        </div>

        {/* টিপ হিস্ট্রি */}
        <h3 className="tips-history-title">{t("Tip History", "টিপ হিস্ট্রি")}</h3>
        
        {history.length === 0 ? (
          <div className="tips-empty">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
            <p>{t("No tip history found.", "কোনো টিপ হিস্ট্রি পাওয়া যায়নি।")}</p>
          </div>
        ) : (
          <div className="tips-list">
            {history.map((item) => {
              const isSender = item.sender_id === profile?.id;
              return (
                <div className="tips-item" key={item.id}>
                  <div className="tips-item-left">
                    <strong>
                      {isSender 
                        ? `${t("To", "প্রাপক")}: ${item.receiver?.game_id || "Unknown"}`
                        : `${t("From", "প্রেরক")}: ${item.sender?.game_id || "Unknown"}`}
                    </strong>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <div className="tips-item-right">
                    {/* ৪. টিপ হিস্ট্রির সবুজ রঙ সাদা করা হয়েছে (text-white) */}
                    <span className={`tips-amount ${isSender ? "text-[#ff4d4d]" : "text-white"}`}>
                      {isSender ? "-" : "+"} ৳{Number(item.amount).toFixed(2)}
                    </span>
                    {getBadge(item.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
