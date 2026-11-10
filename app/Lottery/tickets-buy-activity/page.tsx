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

  const basePath = process.env.NODE_ENV === "production" ? "/NextJS" : "";
  const ticketPrice = Number(searchParams.get("price")) || 50;

  const inputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) setProfile(profileData);
      }

      const { data: methodsData } = await supabase
        .from("control_payment_method")
        .select("*")
        .eq("is_active", true);

      if (methodsData && methodsData.length > 0) {
        setPaymentMethods(methodsData);
        setSelectedMethod(methodsData[0]);
      }
    };
    fetchData();
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 12) {
      setTicketNumber(val);
      setError("");
    }
  };

  const generateRandom = () => {
    let randomNum = "";
    for (let i = 0; i < 12; i++) {
      randomNum += Math.floor(Math.random() * 10).toString();
    }
    setTicketNumber(randomNum);
    setError("");
  };

  const handleManualGenerate = () => {
    setTicketNumber("");
    setError("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBuyTicket = async () => {
    if (ticketNumber.length !== 12) {
      setError(t("Ticket number must be exactly 12 digits.", "টিকিট নাম্বার অবশ্যই ১২ ডিজিটের হতে হবে।"));
      return;
    }
    if (!selectedMethod) {
      setError(t("Please select a payment method.", "অনুগ্রহ করে পেমেন্ট মেথড সিলেক্ট করুন।"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const trackId = `LOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error: insertError } = await supabase.from("ticket_transactions").insert({
        user_id: profile.id,
        ticket_dp_track_id: trackId,
        transaction_type: "ticket_purchase",
        amount: ticketPrice,
        ticket_tier: ticketPrice,
        status: "pending",
      });

      if (insertError) throw insertError;

      alert(t(`Ticket Purchase Initiated! Track ID: ${trackId}`, `টিকিট কেনার রিকোয়েস্ট সফল! ট্র্যাক আইডি: ${trackId}`));
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // নতুন API যা সরাসরি ট্রান্সপারেন্ট ব্যাকগ্রাউন্ডে ভার্টিকাল বারকোড তৈরি করে
  const getBarcodeUrl = (num: string) => {
    if (!num) num = "000000000000";
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${num}&scale=2&rotate=L&includetext=false`;
  };

  return (
    <div className="ticket-buy-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="ticket-buy-main">
        
        {/* টিকিট প্রিভিউ কার্ড */}
        <div className="ticket-preview-card">
          <img 
            src={`${basePath}/ticket-bg.png`} 
            alt="Ticket Background" 
            className="ticket-bg-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          <div className="ticket-left">
            <div className="ticket-price-tag">৳ {ticketPrice}</div>
          </div>

          {/* ডান দিক (শুধু ট্রান্সপারেন্ট ভার্টিকাল বারকোড) */}
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
          <h3>{t("Select 12-Digit Ticket Number", "১২ ডিজিটের টিকিট নাম্বার দিন")}</h3>
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
        </div>

        {/* পেমেন্ট মেথড */}
        <div className="payment-section">
          <h3>{t("Select Payment Method", "পেমেন্ট মেথড সিলেক্ট করুন")}</h3>
          <div className="payment-grid">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`payment-option ${selectedMethod?.id === method.id ? "active" : ""}`}
              >
                <img src={method.method_logo_url} alt={method.method_name} />
                <span>{method.method_name}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* সাবমিট বাটন */}
      <div className="submit-btn-wrapper">
        <button 
          onClick={handleBuyTicket} 
          disabled={submitting || ticketNumber.length !== 12}
          className="buy-ticket-btn"
        >
          {submitting ? t("Processing...", "প্রসেসিং...") : t(`Buy Ticket (৳${ticketPrice})`, `টিকিট কিনুন (৳${ticketPrice})`)}
        </button>
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
