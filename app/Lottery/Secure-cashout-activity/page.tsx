"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./Secure-cashout-activity.css";

export default function SecureCashoutActivityPage() {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ফি পেমেন্টের জন্য স্টেট
  const [feeTrxId, setFeeTrxId] = useState("");
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeMessage, setFeeMessage] = useState({ type: "", text: "" });
  const [copied, setCopied] = useState(false);

  // উইথড্র ফর্মের জন্য স্টেট
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) setProfile(profileData);
      }

      const { data: settingsData } = await supabase.from("lottery_settings").select("*").eq("id", 1).single();
      if (settingsData) setSettings(settingsData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyNumber = () => {
    if (settings?.fee_payment_number) {
      navigator.clipboard.writeText(settings.fee_payment_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ==========================================
  // ফি ক্যালকুলেশন লজিক
  // ==========================================
  const baseFee = Number(settings?.withdrawal_fee_amount) || 200;
  const mgmtPct = Number(settings?.management_fee_pct) || 0;
  const srvcPct = Number(settings?.service_fee_pct) || 0;
  const netPct = Number(settings?.network_fee_pct) || 0;
  const vatPct = Number(settings?.vat_pct) || 0;
  const gstPct = Number(settings?.gst_pct) || 0;

  const totalPercentage = mgmtPct + srvcPct + netPct + vatPct + gstPct;
  const totalFeeAmount = baseFee + (baseFee * totalPercentage) / 100;

  // ফি সাবমিট করার ফাংশন
  const handlePayFee = async () => {
    if (feeTrxId.length < 6) {
      setFeeMessage({ type: "error", text: t("Please enter a valid TrxID.", "সঠিক TrxID দিন।") });
      return;
    }

    setFeeSubmitting(true);
    setFeeMessage({ type: "", text: "" });

    try {
      const trackId = `FEE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error } = await supabase.from("ticket_transactions").insert({
        user_id: profile.id,
        ticket_dp_track_id: trackId,
        transaction_type: "fee_payment",
        amount: totalFeeAmount, // এখানে মোট ফি সেভ হচ্ছে
        trx_id: feeTrxId.toUpperCase(),
        status: "pending",
      });

      if (error) throw error;

      setFeeMessage({ type: "success", text: t("Fee payment submitted! Admin will verify soon.", "ফি পেমেন্ট জমা হয়েছে! অ্যাডমিন শীঘ্রই ভেরিফাই করবেন।") });
      setFeeTrxId("");
    } catch (err: any) {
      setFeeMessage({ type: "error", text: err.message });
    } finally {
      setFeeSubmitting(false);
    }
  };

  // উইথড্র রিকোয়েস্ট সাবমিট
  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < Number(settings?.min_withdrawal_limit || 50000)) {
      setWithdrawMessage({ type: "error", text: t("Minimum withdrawal is", "সর্বনিম্ন উত্তোলন") + ` ৳${settings?.min_withdrawal_limit}` });
      return;
    }
    if (!bankName || !accountName || !accountNumber || !routingNumber) {
      setWithdrawMessage({ type: "error", text: t("Please fill all bank details.", "সব ব্যাংক তথ্য পূরণ করুন।") });
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawMessage({ type: "", text: "" });

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
        setWithdrawMessage({ type: "success", text: data.message + ` (Track ID: ${data.track_id})` });
        setAmount("");
        setBankName("");
        setAccountName("");
        setAccountNumber("");
        setRoutingNumber("");
        fetchData(); // ব্যালেন্স আপডেট
      } else {
        setWithdrawMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setWithdrawMessage({ type: "error", text: err.message });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F5B041] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isFeePaid = profile?.is_lottery_fee_paid;

  return (
    <div className="cashout-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="cashout-main">
        
        {/* ব্যালেন্স কার্ড */}
        <div className="balance-card">
          <span>{t("Withdrawable Lottery Balance", "উত্তোলনযোগ্য লটারি ব্যালেন্স")}</span>
          <h2>৳ {Number(profile?.lottery_balance || 0).toFixed(2)}</h2>
        </div>

        {/* যদি ফি না দেওয়া থাকে */}
        {!isFeePaid ? (
          <div className="form-card">
            <h3 className="form-title">
              <svg className="w-5 h-5 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {t("Withdrawal Activation Required", "উত্তোলন আনলক করুন")}
            </h3>

            <div className="fee-instruction-box">
              <p>1. {t("Send the activation fee to the number below:", "নিচের নাম্বারে অ্যাক্টিভেশন ফি পাঠান:")}</p>
              <div className="specific-number">
                <span>{settings?.fee_payment_number}</span>
                <button onClick={copyNumber} className="copy-btn-small">
                  {copied ? t("Copied!", "কপি!") : t("Copy", "কপি")}
                </button>
              </div>
              
              <div className="fee-amount-text">
                {t("Base Fee", "বেস ফি")}: <span>৳ {baseFee}</span>
              </div>

              {/* ফি ব্রেকডাউন */}
              <div className="fee-breakdown">
                {mgmtPct > 0 && (
                  <div className="fee-row">
                    <span>{t("Management Fee", "ম্যানেজমেন্ট ফি")} ({mgmtPct}%):</span>
                    <span>৳ {((baseFee * mgmtPct) / 100).toFixed(2)}</span>
                  </div>
                )}
                {srvcPct > 0 && (
                  <div className="fee-row">
                    <span>{t("Service Fee", "সার্ভিস ফি")} ({srvcPct}%):</span>
                    <span>৳ {((baseFee * srvcPct) / 100).toFixed(2)}</span>
                  </div>
                )}
                {netPct > 0 && (
                  <div className="fee-row">
                    <span>{t("Network Fee", "নেটওয়ার্ক ফি")} ({netPct}%):</span>
                    <span>৳ {((baseFee * netPct) / 100).toFixed(2)}</span>
                  </div>
                )}
                {vatPct > 0 && (
                  <div className="fee-row">
                    <span>{t("VAT", "ভ্যাট")} ({vatPct}%):</span>
                    <span>৳ {((baseFee * vatPct) / 100).toFixed(2)}</span>
                  </div>
                )}
                {gstPct > 0 && (
                  <div className="fee-row">
                    <span>{t("GST", "জিএসটি")} ({gstPct}%):</span>
                    <span>৳ {((baseFee * gstPct) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* মোট ফি (Total Fee) */}
              <div className="total-fee-row">
                <span>{t("Total Payable Fee", "মোট প্রদেয় ফি")}:</span>
                <span className="total-fee-amount">৳ {totalFeeAmount.toFixed(2)}</span>
              </div>

              <p style={{fontSize: '11px', color: '#A0ADB0', marginTop: '12px', textAlign: 'center'}}>
                * {t("This fee is separate from your lottery balance. It unlocks your withdrawal access permanently.", "এই ফি আপনার লটারি ব্যালেন্স থেকে কাটা হবে না। এটি আপনার উত্তোলন চিরস্থায়ীভাবে আনলক করবে।")}
              </p>
            </div>

            <div className="input-group">
              <label>{t("Transaction ID (TrxID) *", "ট্রানজেকশন আইডি (TrxID) *")}</label>
              <input 
                type="text"
                value={feeTrxId}
                onChange={(e) => setFeeTrxId(e.target.value)}
                placeholder={t("Enter TrxID here", "এখানে TrxID দিন")}
                className="input-field"
              />
            </div>

            {feeMessage.text && <div className={`msg-box ${feeMessage.type}`}>{feeMessage.text}</div>}
          </div>
        ) : (
          /* যদি ফি দেওয়া থাকে (উইথড্র ফর্ম) */
          <div className="form-card">
            <h3 className="form-title">
              <svg className="w-5 h-5 text-[#00E701]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("Bank Withdrawal Form", "ব্যাংক উইথড্র ফর্ম")}
            </h3>

            <div className="input-group">
              <label>{t("Amount (Min 50,000) *", "পরিমাণ (সর্বনিম্ন ৫০,০০০) *")}</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>{t("Bank Name *", "ব্যাংকের নাম *")}</label>
              <input 
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Sonali Bank"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>{t("Account Name *", "অ্যাকাউন্টের নাম *")}</label>
              <input 
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Your Name"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>{t("Account Number *", "অ্যাকাউন্ট নাম্বার *")}</label>
              <input 
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Your Account Number"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>{t("Routing Number *", "রাউটিং নাম্বার *")}</label>
              <input 
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="Routing Number"
                className="input-field"
              />
            </div>

            {withdrawMessage.text && <div className={`msg-box ${withdrawMessage.type}`}>{withdrawMessage.text}</div>}
          </div>
        )}
      </main>

      {/* সাবমিট বাটন (কন্ডিশনাল) */}
      <div className="submit-btn-wrapper">
        {!isFeePaid ? (
          <button 
            onClick={handlePayFee} 
            disabled={feeSubmitting || !feeTrxId}
            className="submit-btn"
          >
            {feeSubmitting ? t("Processing...", "প্রসেসিং...") : t(`Pay Fee (৳${totalFeeAmount.toFixed(0)})`, `ফি পরিশোধ করুন (৳${totalFeeAmount.toFixed(0)})`)}
          </button>
        ) : (
          <button 
            onClick={handleWithdraw} 
            disabled={withdrawSubmitting || !amount || !bankName || !accountName || !accountNumber || !routingNumber}
            className="submit-btn"
          >
            {withdrawSubmitting ? t("Processing...", "প্রসেসিং...") : t("Request Withdrawal", "উত্তোলনের আবেদন করুন")}
          </button>
        )}
      </div>
    </div>
  );
}
