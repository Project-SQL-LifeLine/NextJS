"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./redeem.css";

export default function FreeRedeemCodePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [code, setCode] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/user/login");
        return;
      }

      setIsLoggedIn(true);

      // প্রোফাইল লোড
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData);

      // রিডিম হিস্ট্রি লোড
      const { data: histData } = await supabase
        .from("user_redeem_code_usage_history")
        .select("*")
        .eq("user_id", user.id)
        .order("used_at", { ascending: false });

      if (histData) setHistory(histData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // ১. ইউজারের আইপি অ্যাড্রেস বের করা
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      const userIp = ipData.ip || "unknown";

      // ২. ডাটাবেস ফাংশন কল করা
      const { data, error } = await supabase.rpc("redeem_code_logic", {
        p_code: code.trim(),
        p_ip_address: userIp
      });

      if (error) throw error;

      if (data && data.success) {
        setMessage({
          type: "success",
          text: t(`Success! You received ৳${data.bonus_amount} bonus. ${data.required_turnover} turnover added.`,
                  `সফল! আপনি ৳${data.bonus_amount} বোনাস পেয়েছেন। ${data.required_turnover} টার্নওভার যোগ হয়েছে।`)
        });
        setCode("");
        loadData(); // রিফ্রেশ
      } else {
        setMessage({ type: "error", text: data?.error || t("Failed to redeem code.", "কোড রিডিম ব্যর্থ হয়েছে।") });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("An error occurred.", "একটি সমস্যা হয়েছে।") });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="redeem-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#263C32] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="redeem-page pb-20">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="redeem-main">
        <h1 className="redeem-title">{t("Redeem Code", "রিডিম কোড")}</h1>

        {message.text && (
          <div className={`redeem-alert ${message.type}`}>{message.text}</div>
        )}

        {/* Redeem Form */}
        <div className="redeem-form-card">
          <p className="redeem-desc">
            {t("Enter your promo code below to claim your bonus.", "আপনার বোনাস পেতে নিচে প্রোমো কোডটি দিন।")}
            <br/><br/>
            <strong>{t("Requirement:", "শর্তাবলী:")}</strong> {t("You must have at least required turnover. One IP can use a code once in 15 days.", "প্রয়োজনীয় টার্নওভার থাকতে হবে। একটি আইপি ১৫ দিনে একবার কোডটি ব্যবহার করতে পারবে।")}
          </p>
          <form onSubmit={handleRedeem} className="redeem-form">
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("Enter Code (e.g. EID500)", "কোড দিন (যেমন: EID500)")}
              required 
            />
            <button type="submit" disabled={submitting}>
              {submitting ? t("Checking...", "চেক করা হচ্ছে...") : t("Redeem Code", "রিডিম কোড")}
            </button>
          </form>
        </div>

        {/* History */}
        <h2 className="redeem-section-title">{t("Redeem History", "রিডিম হিস্ট্রি")}</h2>
        {history.length === 0 ? (
          <div className="redeem-empty">
            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            <p>{t("No codes redeemed yet.", "এখনও কোনো কোড রিডিম করা হয়নি।")}</p>
          </div>
        ) : (
          <div className="redeem-list">
            {history.map((item) => (
              <div className="redeem-item" key={item.id}>
                <div className="redeem-item-left">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                  <div>
                    <strong>{item.code_text || "Unknown Code"}</strong>
                    <span>{new Date(item.used_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="redeem-item-right">
                  <span className="redeem-amount">+ ৳{Number(item.bonus_amount).toFixed(2)}</span>
                  <span className="badge approved">{t("Claimed", "ক্লেইমড")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
