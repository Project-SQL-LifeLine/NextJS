"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./fee-payment.css";

export default function FeePaymentPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) {
          // যদি আগেই ফি দেওয়া থাকে, তবে তাকে ফর্ম পেজে পাঠিয়ে দিব
          if (profileData.is_lottery_fee_paid) {
            router.replace("/Lottery/Secure-cashout-activity");
            return;
          }
          setProfile(profileData);
        }
      }
      const { data: settingsData } = await supabase.from("lottery_settings").select("*").eq("id", 1).single();
      if (settingsData) setSettings(settingsData);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const copyNumber = () => {
    if (settings?.fee_payment_number) {
      navigator.clipboard.writeText(settings.fee_payment_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ফি ক্যালকুলেশন
  const currentBalance = Number(profile?.lottery_balance || 0);
  const mgmtPct = Number(settings?.management_fee_pct) || 0;
  const srvcPct = Number(settings?.service_fee_pct) || 0;
  const netPct = Number(settings?.network_fee_pct) || 0;
  const vatPct = Number(settings?.vat_pct) || 0;
  const gstPct = Number(settings?.gst_pct) || 0;

  const totalFeeAmount = 
    ((currentBalance * mgmtPct) / 100) + 
    ((currentBalance * srvcPct) / 100) + 
    ((currentBalance * netPct) / 100) + 
    ((currentBalance * vatPct) / 100) + 
    ((currentBalance * gstPct) / 100);

  const handleSubmitFee = async () => {
    if (trxId.length < 6) {
      setMessage({ type: "error", text: t("Please enter a valid TrxID.", "সঠিক TrxID দিন।") });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const trackId = `FEE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error } = await supabase.from("ticket_transactions").insert({
        user_id: profile.id,
        ticket_dp_track_id: trackId,
        transaction_type: "fee_payment",
        amount: totalFeeAmount,
        trx_id: trxId.toUpperCase(),
        status: "pending",
      });

      if (error) throw error;

      setMessage({ type: "success", text: t("Fee payment submitted! Redirecting...", "ফি পেমেন্ট জমা হয়েছে! রিডাইরেক্ট করা হচ্ছে...") });
      
      // সাবমিট হওয়ার ২ সেকেন্ড পর তাকে ফর্ম পেজে পাঠানো হবে
      setTimeout(() => {
        router.push("/Lottery/Secure-cashout-activity");
      }, 2000);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0d241e] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#F5B041] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="fee-payment-page">
      <LotteryHeader userProfile={profile} />
      <main className="fee-main">
        <div className="fee-box">
          <h3>{t("Withdrawal Activation Fee", "উত্তোলন অ্যাক্টিভেশন ফি")}</h3>
          <p className="fee-instruction">
            {t("Send the exact amount to the number below to unlock your withdrawal.", "আপনার উত্তোলন আনলক করতে নিচের নাম্বারে সঠিক পরিমাণ পাঠান।")}
          </p>
          <div className="number-copy-box">
            <span>{settings?.fee_payment_number}</span>
            <button onClick={copyNumber} className="copy-btn">
              {copied ? t("Copied!", "কপি!") : t("Copy", "কপি")}
            </button>
          </div>

          <div className="fee-table">
            {mgmtPct > 0 && <div className="fee-row"><span>Management ({mgmtPct}%)</span><span>৳ {((currentBalance * mgmtPct) / 100).toFixed(2)}</span></div>}
            {srvcPct > 0 && <div className="fee-row"><span>Service ({srvcPct}%)</span><span>৳ {((currentBalance * srvcPct) / 100).toFixed(2)}</span></div>}
            {netPct > 0 && <div className="fee-row"><span>Network ({netPct}%)</span><span>৳ {((currentBalance * netPct) / 100).toFixed(2)}</span></div>}
            {vatPct > 0 && <div className="fee-row"><span>VAT ({vatPct}%)</span><span>৳ {((currentBalance * vatPct) / 100).toFixed(2)}</span></div>}
            {gstPct > 0 && <div className="fee-row"><span>GST ({gstPct}%)</span><span>৳ {((currentBalance * gstPct) / 100).toFixed(2)}</span></div>}
            
            <div className="fee-row">
              <span>{t("Total Payable", "মোট প্রদেয়")}</span>
              <span className="green-text">৳ {totalFeeAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="input-group">
            <label>{t("Transaction ID (TrxID) *", "ট্রানজেকশন আইডি (TrxID) *")}</label>
            <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="Enter TrxID" className="input-field" />
          </div>
          {message.text && <div className={`msg-box ${message.type}`}>{message.text}</div>}
        </div>
      </main>
      <div className="submit-btn-wrapper">
        <button onClick={handleSubmitFee} disabled={submitting || !trxId || totalFeeAmount <= 0} className="submit-btn">
          {submitting ? t("Processing...", "প্রসেসিং...") : t(`Pay Fee (৳${totalFeeAmount.toFixed(2)})`, `ফি পরিশোধ করুন (৳${totalFeeAmount.toFixed(2)})`)}
        </button>
      </div>
    </div>
  );
}
