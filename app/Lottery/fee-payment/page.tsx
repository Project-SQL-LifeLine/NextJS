"use client";

import { useState, useEffect, useRef } from "react";
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
  const [copiedAmount, setCopiedAmount] = useState(false);
  
  // Under Review স্টেট
  const [isUnderReview, setIsUnderReview] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ডাটা ফেচ এবং পেন্ডিং চেক
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) {
            if (profileData.is_lottery_fee_paid) {
              router.replace("/Lottery/Secure-cashout-activity");
              return;
            }
            setProfile(profileData);
          }

          // চেক করা হচ্ছে ইউজারের কোনো ফি পেমেন্ট কি পেন্ডিং আছে কি না
          const { data: pendingTx } = await supabase
            .from("ticket_transactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("transaction_type", "fee_payment")
            .eq("status", "pending")
            .limit(1);

          if (pendingTx && pendingTx.length > 0) {
            setIsUnderReview(true);
          }
        }
        
        const { data: settingsData } = await supabase.from("lottery_settings").select("*").eq("id", 1).single();
        if (settingsData) setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // ৩.১ সেকেন্ড লোডিং
    const timer = new Promise((resolve) => setTimeout(resolve, 3100));
    Promise.all([fetchData(), timer]).then(() => {
      setLoading(false);
    });

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router]);

  // Under Review থাকাকালীন পোলিং (অটো চেক)
  useEffect(() => {
    if (isUnderReview && profile) {
      pollingRef.current = setInterval(async () => {
        // চেক করা হচ্ছে ফি পেইড হয়েছে কি না
        const { data: profileData } = await supabase.from("profiles").select("is_lottery_fee_paid").eq("id", profile.id).single();
        
        if (profileData?.is_lottery_fee_paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          router.replace("/Lottery/Secure-cashout-activity");
          return;
        }

        // চেক করা হচ্ছে পেমেন্ট রিজেক্ট হয়েছে কি না
        const { data: txData } = await supabase
          .from("ticket_transactions")
          .select("status")
          .eq("user_id", profile.id)
          .eq("transaction_type", "fee_payment")
          .order("created_at", { ascending: false })
          .limit(1);

        if (txData && txData.length > 0 && txData[0].status === "rejected") {
           setIsUnderReview(false);
           setMessage({ type: "error", text: t("Your payment was rejected. Please try again with a valid TrxID.", "আপনার পেমেন্টটি বাতিল করা হয়েছে। সঠিক TrxID দিয়ে আবার চেষ্টা করুন।") });
           if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }, 10000); // প্রতি ১০ সেকেন্ড পর পর চেক করবে
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isUnderReview, profile, router, t]);


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

  // অ্যামাউন্ট কপি লজিক
  const copyAmountToClipboard = () => {
    navigator.clipboard.writeText(totalFeeAmount.toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleSubmitFee = async () => {
    if (trxId.length < 8) {
      setMessage({ type: "error", text: t("Please enter a valid TrxID (Min 8 characters).", "সঠিক TrxID দিন (কমপক্ষে ৮ ডিজিট)।") });
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

      // সাবমিট সফল হলে Under Review স্টেট অন করা হবে
      setIsUnderReview(true);
      setTrxId("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // মেইন লোডিং স্ক্রিন
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        {isUnderReview ? (
          // Under Review UI
          <div className="under-review-box">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2">Under Review</h3>
            <p className="text-white font-semibold text-center mb-1">
              Payment Verification
            </p>
            <p className="text-gray-400 text-sm text-center">
              Please Wait 1/2 Hours
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          // ফর্ম UI
          <div className="fee-box">
            <h3>{t("VAT & GST FEE", "ভ্যাট এবং জিএসটি ফি")}</h3>
            <p className="fee-instruction">
              {t("Send the exact amount to the number below to unlock your withdrawal.", "আপনার উত্তোলন আনলক করতে নিচের নাম্বারে সঠিক পরিমাণ পাঠান।")}
            </p>

            <div className="number-copy-box">
              <div className="flex items-center gap-2">
                 <img 
                   src="https://i.ibb.co.com/ynRH1K3z/file-00000000ee6482089b62b469990f602a.png" 
                   alt="bKash" 
                   className="bkash-logo" 
                 />
                 <span>{settings?.fee_payment_number}</span>
              </div>
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
                <div className="flex items-center">
                  {/* Green থেকে White করা হলো */}
                  <span className="text-white font-bold text-[18px]">৳ {totalFeeAmount.toFixed(2)}</span>
                  <button onClick={copyAmountToClipboard} className="copy-amount-btn" title="Copy Amount">
                    {copiedAmount ? (
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <polyline points="20 6 9 17 4 12"></polyline>
                       </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
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
                disabled={submitting}
              />
            </div>

            {message.text && <div className={`msg-box ${message.type}`}>{message.text}</div>}
          </div>
        )}
      </main>

      {!isUnderReview && (
        <div className="submit-btn-wrapper">
          <button 
            onClick={handleSubmitFee} 
            disabled={submitting || !trxId || totalFeeAmount <= 0}
            className="submit-btn flex justify-center items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("Processing...", "প্রসেসিং...")}
              </>
            ) : (
              t("Pay Fee", "ফি পরিশোধ করুন")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
