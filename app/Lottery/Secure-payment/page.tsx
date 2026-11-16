"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./Secure-payment.css";

export default function SecurePaymentPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [loading, setLoading] = useState(true); 
  
  const [amount, setAmount] = useState<string>("");
  const [trxId, setTrxId] = useState<string>("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const presetAmounts = [100, 500, 1000, 2000, 5000];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // ইউজার লগইন না থাকলে লগইন পেজে পাঠিয়ে দেবে
        if (!user) {
          router.replace("/user/login");
          return;
        }

        const { data: profileData } = await supabase.from("profiles").select("id, game_id, lottery_balance").eq("id", user.id).single();
        if (profileData) setProfile(profileData);

        const { data: methodsData } = await supabase
          .from("control_payment_method")
          .select("*")
          .eq("is_active", true);

        if (methodsData && methodsData.length > 0) {
          setPaymentMethods(methodsData);
          setSelectedMethod(methodsData[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    // ৩.১ সেকেন্ড (৩১০০ মিলি সেকেন্ড) লোডিং টাইমার
    const timer = new Promise((resolve) => setTimeout(resolve, 3100));
    
    Promise.all([fetchData(), timer]).then(() => {
      setLoading(false);
    });
  }, [router]);

  const copyNumber = () => {
    if (selectedMethod?.admin_payment_number) {
      navigator.clipboard.writeText(selectedMethod.admin_payment_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // TrxID ইনপুটে শুধু ইংরেজি অক্ষর এবং সংখ্যা গ্রহণ করার লজিক
  const handleTrxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // বাংলা বা স্পেসিয়াল ক্যারেক্টার বাদ দিয়ে শুধু A-Z এবং 0-9 রাখবে
    const cleanValue = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
    setTrxId(cleanValue.toUpperCase());
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async () => {
    const depositAmount = Number(amount);
    
    if (!depositAmount || depositAmount < 50) {
      setError(t("Minimum reload amount is 50.", "সর্বনিম্ন রিলোড পরিমাণ ৫০ টাকা।"));
      return;
    }
    if (!selectedMethod) {
      setError(t("Please select a payment method.", "পেমেন্ট মেথড সিলেক্ট করুন।"));
      return;
    }
    
    // মিনিমাম ৮ অক্ষরের চেক
    if (trxId.length < 8) {
      setError(t("Transaction ID must be at least 8 characters/digits.", "ট্রানজেকশন আইডি কমপক্ষে ৮ অক্ষরের হতে হবে।"));
      return;
    }
    
    if (!profile) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const trackId = `RLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error: insertError } = await supabase.from("ticket_transactions").insert({
        user_id: profile.id,
        ticket_dp_track_id: trackId,
        transaction_type: "balance_reload", 
        amount: depositAmount,
        trx_id: trxId,
        status: "pending",
        bank_details: { method: selectedMethod.method_name }
      });

      if (insertError) throw insertError;

      setSuccessMsg(t(`Reload request of ৳${depositAmount} submitted successfully!`, `৳${depositAmount} রিলোড রিকোয়েস্ট সফলভাবে জমা হয়েছে!`));
      setAmount("");
      setTrxId("");

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ৩.১ সেকেন্ডের সাদা লোডিং স্ক্রিন
  // ==========================================
  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0d241e] flex flex-col items-center justify-center">
        <svg 
          className="w-12 h-12 text-white animate-spin" 
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
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">
          SECURE PAYMENT...
        </p>
      </div>
    );
  }

  return (
    <div className="secure-payment-page">
      <LotteryHeader userProfile={profile} />

      <main className="secure-main">
        
        {/* বর্তমান ব্যালেন্স */}
        <div className="balance-info-card">
          <span>{t("Current Lottery Balance", "বর্তমান লটারি ব্যালেন্স")}</span>
          <h2>৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</h2>
        </div>

        {/* এমাউন্ট সিলেকশন */}
        <div>
          <h3 className="sec-title">{t("Reload Amount", "রিলোড পরিমাণ")}</h3>
          <div className="amount-grid">
            {presetAmounts.map((amt) => (
              <button 
                key={amt}
                onClick={() => { setAmount(amt.toString()); setError(""); }}
                className={`amount-btn ${amount === amt.toString() ? "active" : ""}`}
              >
                ৳ {amt}
              </button>
            ))}
          </div>
          <input 
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder={t("Enter custom amount", "কাস্টম পরিমাণ লিখুন")}
            className="custom-amount-input"
          />
        </div>

        {/* পেমেন্ট মেথড */}
        <div>
          <h3 className="sec-title">{t("Select Payment Method", "পেমেন্ট মেথড সিলেক্ট করুন")}</h3>
          <div className="payment-grid">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => { setSelectedMethod(method); setCopied(false); }}
                className={`payment-option ${selectedMethod?.id === method.id ? "active" : ""}`}
              >
                <img src={method.method_logo_url} alt={method.method_name} />
                <span>{method.method_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ইন্সট্রাকশন এবং ডাইনামিক অ্যাডমিন নাম্বার */}
        <div className="instruction-box">
          <p>1. {t("Send money to", "টাকা পাঠান")} <b>{selectedMethod?.method_name || "Payment Method"}</b>:</p>
          
          <div className="admin-number-container">
            <div className="admin-number">
              {selectedMethod?.admin_payment_number || t("Number not set", "নাম্বার সেট নেই")}
            </div>
            {selectedMethod?.admin_payment_number && (
              <button onClick={copyNumber} className="copy-btn-small">
                {copied ? t("Copied!", "কপি!") : t("Copy", "কপি")}
              </button>
            )}
          </div>

          <p style={{ marginTop: '8px' }}>2. {t("Enter TrxID below.", "নিচে TrxID দিন।")}</p>
        </div>

        {/* ট্রানজেকশন আইডি ইনপুট */}
        <div>
          <h3 className="sec-title">{t("Transaction ID (TrxID)", "ট্রানজেকশন আইডি (TrxID)")}</h3>
          <input 
            type="text"
            value={trxId}
            onChange={handleTrxIdChange}
            placeholder={t("Min 8 characters", "কমপক্ষে ৮ অক্ষর")}
            className="trx-input"
            maxLength={20}
          />
        </div>

        {error && <div className="msg-box error">{error}</div>}
        {successMsg && <div className="msg-box success">{successMsg}</div>}

      </main>

      {/* সাবমিট বাটন */}
      <div className="submit-btn-wrapper">
        <button 
          onClick={handleSubmit} 
          disabled={submitting || !amount || trxId.length < 8 || !selectedMethod?.admin_payment_number}
          className="submit-btn"
        >
          {submitting ? t("Submitting...", "জমা হচ্ছে...") : t("Submit Reload Request", "রিলোড রিকোয়েস্ট জমা দিন")}
        </button>
      </div>
    </div>
  );
}
