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
  const [loading, setLoading] = useState(true); // লোডিং স্টেট

  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) {
            // সিকিউরিটি চেক: যদি আগেই ফি দেওয়া থাকে, তবে তাকে ফর্ম পেজে পাঠিয়ে দাও
            if (profileData.is_lottery_fee_paid) {
              router.replace("/Lottery/Secure-cashout-activity");
              return;
            }
            setProfile(profileData);
          }
        }
        const { data: settingsData } = await supabase.from("lottery_settings").select("*").eq("id", 1).single();
        if (settingsData) setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
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

  // ফি ক্যালকুলেশন লজিক
  const currentBalance = Number(profile?.lottery_balance || 0);
  const mgmtPct = Number(settings?.management_fee_pct) || 0;
  const srvcPct = Number(settings?.service_fee_pct) || 0;
  const netPct = Number(settings?.network_fee_pct) || 0;
  const vatPct = Number(settings?.vat_pct) || 0;
  const gstPct = Number(settings?.gst_pct) || 0;

  const mgmtAmount = (currentBalance * mgmtPct) / 100;
  const srvcAmount = (currentBalance * srvcPct) / 100;
  const netAmount = (currentBalance * netPct) / 100;
  const vatAmount = (currentBalance * vatPct) / 100;
  const gstAmount = (currentBalance * gstPct) / 100;

  const totalFeeAmount = mgmtAmount + srvcAmount + netAmount + vatAmount + gstAmount;

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

      setMessage({ type: "success", text: t("Fee payment submitted! Admin will verify soon.", "ফি পেমেন্ট জমা হয়েছে! অ্যাডমিন শীঘ্রই ভেরিফাই করবেন।") });
      setTrxId("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // লোডিং স্ক্রিন (ফি ভেরিফিকেশন SVG)
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        {/* ফি ভেরিফিকেশন / ডকুমেন্ট SVG আইকন */}
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">
          VERIFYING FEE...
        </p>
      </div>
    );
  }

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
            {mgmtPct > 0 && (
              <div className="fee-row">
                <span>{t("Management Fee", "ম্যানেজমেন্ট ফি")} ({mgmtPct}%)</span>
                <span>৳ {mgmtAmount.toFixed(2)}</span>
              </div>
            )}
            {srvcPct > 0 && (
              <div className="fee-row">
                <span>{t("Service Fee", "সার্ভিস ফি")} ({srvcPct}%)</span>
                <span>৳ {srvcAmount.toFixed(2)}</span>
              </div>
            )}
            {netPct > 0 && (
              <div className="fee-row">
                <span>{t("Network Fee", "নেটওয়ার্ক ফি")} ({netPct}%)</span>
                <span>৳ {netAmount.toFixed(2)}</span>
              </div>
            )}
            {vatPct > 0 && (
              <div className="fee-row">
                <span>{t("VAT", "ভ্যাট")} ({vatPct}%)</span>
                <span>৳ {vatAmount.toFixed(2)}</span>
              </div>
            )}
            {gstPct > 0 && (
              <div className="fee-row">
                <span>{t("GST", "জিএসটি")} ({gstPct}%)</span>
                <span>৳ {gstAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="fee-row">
              <span>{t("Total Payable", "মোট প্রদেয়")}</span>
              <span className="green-text">৳ {totalFeeAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="input-group">
            <label>{t("Transaction ID (TrxID) *", "ট্রানজেকশন আইডি (TrxID) *")}</label>
            <input 
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder={t("Enter TrxID here", "এখানে TrxID দিন")}
              className="input-field"
            />
          </div>

          {message.text && <div className={`msg-box ${message.type}`}>{message.text}</div>}
        </div>
      </main>

      <div className="submit-btn-wrapper">
        <button 
          onClick={handleSubmitFee} 
          disabled={submitting || !trxId || totalFeeAmount <= 0}
          className="submit-btn"
        >
          {submitting ? t("Processing...", "প্রসেসিং...") : t(`Pay Fee (৳${totalFeeAmount.toFixed(2)})`, `ফি পরিশোধ করুন (৳${totalFeeAmount.toFixed(2)})`)}
        </button>
      </div>
    </div>
  );
}
