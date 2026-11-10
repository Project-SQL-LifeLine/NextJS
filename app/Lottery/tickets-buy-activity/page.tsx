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
  const [successMsg, setSuccessMsg] = useState("");

  // প্রোফাইল এবং পেমেন্ট মেথড লোড করা
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from("profiles").select("id, game_id, lottery_balance").eq("id", user.id).single();
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

  useEffect(() => {
    fetchData();
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

  // টিকিট কেনার ফাংশন (ব্যালেন্স চেক সহ)
  const handleBuyTicket = async () => {
    if (ticketNumber.length !== 12) {
      setError(t("Ticket number must be exactly 12 digits.", "টিকিট নাম্বার অবশ্যই ১২ ডিজিটের হতে হবে।"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      // ডাটাবেস ফাংশন কল করে সরাসরি ব্যালেন্স কাটা এবং টিকিট অ্যাপ্রুভ করা
      const { data, error: rpcError } = await supabase.rpc("purchase_lottery_ticket", {
        p_ticket_price: ticketPrice,
        p_ticket_number: ticketNumber
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        setSuccessMsg(data.message + ` (Track ID: ${data.track_id})`);
        setTicketNumber(""); // টিকিট নাম্বার ক্লিয়ার করা
        
        // প্রোফাইল রিফ্রেশ করা যাতে নতুন ব্যালেন্স দেখা যায়
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

  // রিলোড ব্যালেন্স পেজে যাওয়ার ফাংশন
  const handleReloadBalance = () => {
    router.push("/Lottery/Secure-payment");
  };

  const getBarcodeUrl = (num: string) => {
    if (!num) num = "000000000000";
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${num}&scale=2&rotate=L&includetext=false`;
  };

  // ব্যালেন্স চেক
  const currentBalance = Number(profile?.lottery_balance || 0);
  const hasEnoughBalance = currentBalance >= ticketPrice;

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
            <span className="text-[10px] text-[#F5B041] font-bold bg-[#F5B041]/10 px-2 py-1 rounded border border-[#F5B041]/30">
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
          {successMsg && <div className="text-green-500 text-[11px] text-center mt-2 font-bold">{successMsg}</div>}
        </div>

        {/* পেমেন্ট মেথড (শুধুমাত্র রিলোড করার প্রয়োজন হলে দেখাবে, তবে ইউজারের সুবিধার্থে সবসময় দেখানো ভালো) */}
        <div className="payment-section">
          <h3>{t("Select Payment Method (For Reload)", "পেমেন্ট মেথড (রিলোডের জন্য)")}</h3>
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

      {/* সাবমিট বাটন (কন্ডিশনাল) */}
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
            className="buy-ticket-btn !bg-[#F5B041] !text-black !border-black"
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
