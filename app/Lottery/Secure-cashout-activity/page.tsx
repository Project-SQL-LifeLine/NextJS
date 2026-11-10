"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./Secure-cashout-activity.css";

export default function SecureCashoutActivityPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) {
          // সিকিউরিটি চেক: যদি ফি না দেওয়া থাকে তবে তাকে ফি পেজে পাঠিয়ে দাও
          if (!profileData.is_lottery_fee_paid) {
            router.replace("/Lottery/fee-payment");
            return;
          }
          setProfile(profileData);
        }
      }
      const { data: settingsData } = await supabase.from("lottery_settings").select("*").eq("id", 1).single();
      if (settingsData) setSettings(settingsData);
      setLoading(false);
    };
    checkAccess();
  }, [router]);

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < Number(settings?.min_withdrawal_limit || 50000)) {
      setMessage({ type: "error", text: `${t("Minimum withdrawal is", "সর্বনিম্ন উত্তোলন")} ৳${settings?.min_withdrawal_limit}` });
      return;
    }
    if (!bankName || !accountName || !accountNumber || !routingNumber) {
      setMessage({ type: "error", text: t("Please fill all bank details.", "সব ব্যাংক তথ্য পূরণ করুন।") });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("request_lottery_withdrawal", {
        p_amount: withdrawAmount,
        p_bank_name: bankName,
        p_account_name: accountName,
        p_account_number: accountNumber,
        p_routing_number: routingNumber,
      });

      if (error) throw error;

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setAmount("");
        setBankName("");
        setAccountName("");
        setAccountNumber("");
        setRoutingNumber("");
        // ব্যালেন্স আপডেট
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
        if (profileData) setProfile(profileData);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0d241e] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#F5B041] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="cashout-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="cashout-main">
        <div className="balance-card">
          <span>{t("Withdrawable Lottery Balance", "উত্তোলনযোগ্য লটারি ব্যালেন্স")}</span>
          <h2>৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</h2>
        </div>

        <div className="form-card">
          <h3 className="form-title">
            <svg className="w-5 h-5 text-[#00E701]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t("Bank Withdrawal Form", "ব্যাংক উইথড্র ফর্ম")}
          </h3>

          <div className="input-group">
            <label>{t("Amount (Min 50,000) *", "পরিমাণ (সর্বনিম্ন ৫০,০০০) *")}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" className="input-field" />
          </div>
          <div className="input-group">
            <label>{t("Bank Name *", "ব্যাংকের নাম *")}</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Sonali Bank" className="input-field" />
          </div>
          <div className="input-group">
            <label>{t("Account Name *", "অ্যাকাউন্টের নাম *")}</label>
            <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Your Name" className="input-field" />
          </div>
          <div className="input-group">
            <label>{t("Account Number *", "অ্যাকাউন্ট নাম্বার *")}</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Your Account Number" className="input-field" />
          </div>
          <div className="input-group">
            <label>{t("Routing Number *", "রাউটিং নাম্বার *")}</label>
            <input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} placeholder="Routing Number" className="input-field" />
          </div>

          {message.text && <div className={`msg-box ${message.type}`}>{message.text}</div>}
        </div>
      </main>

      <div className="submit-btn-wrapper">
        <button onClick={handleWithdraw} disabled={submitting || !amount || !bankName || !accountName || !accountNumber || !routingNumber} className="submit-btn">
          {submitting ? t("Processing...", "প্রসেসিং...") : t("Request Withdrawal", "উত্তোলনের আবেদন করুন")}
        </button>
      </div>
    </div>
  );
}
