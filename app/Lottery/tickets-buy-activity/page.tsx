"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./tickets-buy-activity.css";

function TicketBuyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const ticketPrice = Number(searchParams.get("price")) || 50;
  const inputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true); // ২.৯ সেকেন্ডের লোডিং স্টেট
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // প্রোফাইল লোড করা
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from("profiles").select("id, game_id, lottery_balance").eq("id", user.id).single();
      if (profileData) setProfile(profileData);
    }
  };

  // ২.৯ সেকেন্ড (২৯০০ মিলি সেকেন্ড) লোডিং টাইমার লজিক
  useEffect(() => {
    const timer = new Promise((resolve) => setTimeout(resolve, 2900));
    
    Promise.all([fetchData(), timer]).then(() => {
      setLoading(false);
    });
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 12) {
      setTicketNumber(val);
      setError("");
      setSuccessMsg("");
    }
  };

  const generateRandom = () => {
    let randomNum = "";
    for (let i = 0; i < 12; i++) {
      randomNum += Math.floor(Math.random() * 10).toString();
    }
    setTicketNumber(randomNum);
    setError("");
    setSuccessMsg("");
  };

  const handleManualGenerate = () => {
    setTicketNumber("");
    setError("");
    setSuccessMsg("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBuyTicket = async () => {
    if (ticketNumber.length !== 12) {
      setError(t("Ticket number must be exactly 12 digits.", "টিকিট নাম্বার অবশ্যই ১২ ডিজিটের হতে হবে।"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data, error: rpcError } = await supabase.rpc("purchase_lottery_ticket", {
        p_ticket_price: ticketPrice,
        p_ticket_number: ticketNumber
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        setSuccessMsg(data.message + ` (Track ID: ${data.track_id})`);
        setTicketNumber(""); 
        fetchData(); 
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReloadBalance = () => {
    router.push("/Lottery/Secure-payment");
  };

  const getBarcodeUrl = (num: string) => {
    if (!num) num = "000000000000";
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${num}&scale=2&rotate=L&includetext=false`;
  };

  const currentBalance = Number(profile?.lottery_balance || 0);
  const hasEnoughBalance = currentBalance >= ticketPrice;

  // ==========================================
  // ২.৯ সেকেন্ডের সাদা লটারি SVG অ্যানিমেশন
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <div className="ticket-loader">
          {/* সাদা টিকিট SVG */}
          <svg 
            className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
          </svg>
        </div>
        <p className="text-white mt-6 font-bold tracking-widest animate-pulse text-[12px]">
          LOADING TICKET...
        </p>
      </div>
    );
  }

  return (
    <div className="ticket-buy-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="ticket-buy-main">
        
        {/* সম্পূর্ণ CSS ভিত্তিক টিকিট ডিজাইন */}
        <div className="ticket-preview-card">
          <div className="ticket-left">
            <h2 className="ticket-title">LUCKY<br/>TICKET</h2>
            <span className="ticket-subtitle">{t("Official Draw", "অফিসিয়াল ড্র")}</span>
            <div className="ticket-price-tag">৳ {ticketPrice}</div>
          </div>

          <div className="ticket-divider"></div>

          <div className="ticket-right">
            <div className="barcode-vertical-wrapper">
              <img 
                src={getBarcodeUrl(ticketNumber)} 
                alt="Ticket Barcode" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getBarcodeUrl("000000000000");
                }}
              />
            </div>
          </div>
        </div>

        {/* নাম্বার ইনপুট সেকশন */}
        <div className="input-section">
          <div className="flex justify-between items-center mb-3">
            <h3>{t("Select 12-Digit Ticket Number", "১২ ডিজিটের টিকিট নাম্বার দিন")}</h3>
            
            {/* Gold থেকে White করা হলো */}
            <span className="text-[10px] text-white font-bold bg-white/10 px-2 py-1 rounded border border-white/30">
              {t("Balance", "ব্যালেন্স")}: ৳ {currentBalance.toFixed(2)}
            </span>
          </div>
          
          <input
            type="tel"
            inputMode="numeric"
            ref={inputRef}
            value={ticketNumber}
            onChange={handleNumberChange}
            placeholder={t("Enter 12 digit number", "১২ ডিজিটের নাম্বার লিখুন")}
            className="ticket-number-input"
          />
          
          <div className="helper-text">
            <span>{ticketNumber.length}/12 {t("digits", "ডিজিট")}</span>
            
            <div className="button-group">
              <button onClick={generateRandom} className="action-btn">
                {t("Random", "র‍্যান্ডম")}
              </button>
              <button onClick={handleManualGenerate} className="action-btn">
                {t("Manual", "ম্যানুয়াল")}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {successMsg && <div className="success-msg">{successMsg}</div>}

          {/* নতুন যোগ করা Disclaimer (সতর্কতামূলক বার্তা) */}
          <div className="disclaimer-box">
            <p>
              <strong>⚠️ {t("Disclaimer:", "সতর্কতা:")}</strong>{" "}
              {t(
                "If any user attempts fraud, forgery, or manipulation with ticket numbers, the authority reserves the right to temporarily suspend their account for verification purposes.",
                "যদি কোনো ইউজার জালিয়াতি, টিকিট নাম্বার জাল বা ম্যানিপুলেট করার চেষ্টা করে, তবে যাচাইয়ের জন্য কর্তৃপক্ষ তাদের অ্যাকাউন্ট সাময়িকভাবে স্থগিত রাখার অধিকার রাখে।"
              )}
            </p>
          </div>

        </div>

      </main>

      {/* সাবমিট বাটন */}
      <div className="submit-btn-wrapper">
        {hasEnoughBalance ? (
          <button 
            onClick={handleBuyTicket} 
            disabled={submitting || ticketNumber.length !== 12}
            className="buy-ticket-btn"
          >
            {submitting ? t("Processing...", "প্রসেসিং...") : t(`Buy Ticket (৳${ticketPrice})`, `টিকিট কিনুন (৳${ticketPrice})`)}
          </button>
        ) : (
          <button 
            onClick={handleReloadBalance} 
            className="buy-ticket-btn !bg-white !text-black !border-black" /* Gold থেকে White */
          >
            {t("Reload Balance", "ব্যালেন্স রিলোড করুন")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TicketBuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d241e] flex items-center justify-center text-white">Loading...</div>}>
      <TicketBuyContent />
    </Suspense>
  );
}
