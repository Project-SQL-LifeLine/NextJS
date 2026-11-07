"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function WithdrawalPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [balance, setBalance] = useState(0);
  const [reqTurnover, setReqTurnover] = useState(0);
  const [compTurnover, setCompTurnover] = useState(0);
  const [txnPasswordDb, setTxnPasswordDb] = useState<string | null>(null);
  
  const [allWallets, setAllWallets] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("bkash");
  
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const methods = [
    { id: "bkash", name: "bKash", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png" },
    { id: "nagad", name: "Nagad", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nagad_Logo.svg/512px-Nagad_Logo.svg.png" },
    { id: "rocket", name: "Rocket", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Rocket_Logo.svg/512px-Rocket_Logo.svg.png" }
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/user/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("balance, total_required_turnover, total_completed_turnover, transaction_password")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setBalance(Number(profile.balance) || 0);
        setReqTurnover(Number(profile.total_required_turnover) || 0);
        setCompTurnover(Number(profile.total_completed_turnover) || 0);
        setTxnPasswordDb(profile.transaction_password);
      }

      const { data: wallets } = await supabase
        .from("user_payment_type_store")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (wallets) setAllWallets(wallets);
      setLoading(false);
    };
    
    fetchInitialData();
  }, [router]);

  const savedWallets = useMemo(() => {
    return allWallets.filter(w => w.method_code === selectedMethod);
  }, [allWallets, selectedMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const numericAmount = Number(amount);

    if (savedWallets.length === 0) {
      setMessage(t("Please link an e-wallet first.", "অনুগ্রহ করে প্রথমে একটি ই-ওয়ালেট লিংক করুন।"));
      return;
    }
    if (reqTurnover > compTurnover) {
      setMessage(t("Your turnover is not complete.", "আপনার টার্নওভার সম্পূর্ণ হয়নি।"));
      return;
    }
    if (numericAmount < 100) {
      setMessage(t("Minimum withdrawal is 100 BDT.", "সর্বনিম্ন উইথড্র ১০০ টাকা।"));
      return;
    }
    if (numericAmount > 25000) {
      setMessage(t("Maximum withdrawal is 25,000 BDT.", "সর্বোচ্চ উইথড্র ২৫,০০০ টাকা।"));
      return;
    }
    if (numericAmount > balance) {
      setMessage(t("Insufficient balance.", "আপনার পর্যাপ্ত ব্যালেন্স নেই।"));
      return;
    }
    if (!password) {
      setMessage(t("Enter transaction password.", "ট্রানজেকশন পাসওয়ার্ড দিন।"));
      return;
    }
    
    if (txnPasswordDb && password !== txnPasswordDb) {
      setMessage(t("Incorrect transaction password!", "ভুল ট্রানজেকশন পাসওয়ার্ড!"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("user_deposit_transaction").insert({
        user_id: session.user.id,
        transaction_type: "withdrawal",
        method_code: selectedMethod,
        amount: numericAmount,
        status: "pending",
        transaction_reference: savedWallets[0].account_number
      });

      if (error) throw error;

      await supabase.from("profiles").update({ balance: balance - numericAmount }).eq("id", session.user.id);

      setIsSuccess(true);
      setBalance(balance - numericAmount);
      setAmount("");
      setPassword("");
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setMessage(err.message || t("Withdrawal request failed.", "উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে।"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isTurnoverComplete = compTurnover >= reqTurnover;

  const maskNumber = (num: string) => {
    if (!num) return "";
    return "*******" + num.slice(-4);
  };

  return (
    <div className="min-h-screen bg-white pb-10 font-sans text-gray-800 overflow-x-hidden w-full max-w-full">
      
      {/* Top Bar */}
      <header className="bg-[#1475E0] px-4 py-4 flex items-center justify-between sticky top-0 z-50 w-full">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-white">{t("Withdrawal", "উত্তোলন")}</h1>
        <button onClick={() => router.push("/wallets/voucher-report")} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </button>
      </header>

      {/* ট্যাব */}
      <div className="flex border-b border-gray-200 w-full overflow-hidden">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex-1 py-3 text-center text-sm transition-all flex items-center justify-center gap-1 ${
              selectedMethod === method.id 
                ? "text-red-600 font-bold border-b-2 border-red-600" 
                : "text-gray-500 font-medium"
            }`}
          >
            <img src={method.logo} alt="" className="h-4 sm:h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="truncate">{method.name}</span>
          </button>
        ))}
      </div>

      <div className="p-4 w-full max-w-full overflow-hidden">
        
        {/* E-wallet সেকশন (হরাইজন্টাল স্লাইডার) */}
        <div className="mb-6 relative w-full">
          <h3 className="text-gray-700 text-base font-medium mb-3">
            {t("Registered E-wallet", "রেজিস্টার্ড ই-ওয়ালেট")} ({savedWallets.length}/5)
          </h3>
          
          {savedWallets.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
              {savedWallets.map((wallet) => (
                <div key={wallet.id} className="relative min-w-[90vw] sm:min-w-[320px] flex-shrink-0 snap-center bg-gradient-to-br from-[#7B5CFF] to-[#00D4FF] rounded-2xl p-5 text-white shadow-lg overflow-hidden h-[170px] flex flex-col justify-between">
                  
                  {/* কার্ডের পেছনের ওয়েভ ডিজাইন */}
                  <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="20" opacity="0.5"/>
                      <circle cx="100" cy="100" r="120" stroke="white" strokeWidth="20" opacity="0.3"/>
                      <circle cx="100" cy="100" r="160" stroke="white" strokeWidth="20" opacity="0.1"/>
                    </svg>
                  </div>

                  {/* কার্ডের উপরের অংশ */}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 p-1.5 rounded-md backdrop-blur-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <span className="font-semibold text-xl tracking-wide">{selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}</span>
                  </div>

                  {/* কার্ডের নাম্বার */}
                  <div className="relative z-10">
                    <p className="text-2xl font-bold tracking-[0.15em] mb-1">{maskNumber(wallet.account_number)}</p>
                    <p className="text-xs text-white/80 font-medium">
                      {new Date(wallet.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State UI (কার্ড না থাকলে) */
            <div className="relative border border-gray-100 bg-[#F8F9FA] rounded-2xl h-[170px] flex flex-col items-center justify-center w-full overflow-hidden">
              {/* ব্যাকগ্রাউন্ড ইলাস্ট্রেশন */}
              <div className="absolute inset-0 flex items-center justify-center opacity-60">
                <svg width="250" height="150" viewBox="0 0 250 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="65" y="30" width="120" height="75" rx="8" fill="#E5E7EB" />
                  <rect x="75" y="45" width="40" height="6" rx="3" fill="#D1D5DB" />
                  <rect x="75" y="60" width="30" height="6" rx="3" fill="#D1D5DB" />
                  <circle cx="160" cy="50" r="12" fill="#D1D5DB" />
                  <path d="M45 105 C 65 80, 85 80, 105 105" stroke="#F3F4F6" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M145 105 C 165 80, 185 80, 205 105" stroke="#F3F4F6" strokeWidth="15" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-gray-400 text-sm font-medium relative z-10 mt-10">
                {t("No E-Wallet linked yet", "এখনও কোনো ই-ওয়ালেট যুক্ত করা হয়নি")}
              </span>
            </div>
          )}

          {/* প্লাস বাটন */}
          {savedWallets.length < 5 && (
            <button 
              onClick={() => router.push("/wallets/securityCenter/addBankCard")}
              className="absolute bottom-2 right-2 w-14 h-14 bg-[#FF0000] rounded-full flex items-center justify-center text-white shadow-[0_4px_10px_rgba(255,0,0,0.4)] hover:bg-red-700 transition z-20"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          {/* ইনফরমেশন */}
          <div className="flex flex-col gap-2 mb-6 text-sm text-gray-500">
            <p>{t("Withdrawal time: 24 Hours", "উত্তোলনের সময়: ২৪ ঘন্টা")}</p>
            <p>{t("Daily withdrawal Unlimited", "দৈনিক উত্তোলন আনলিমিটেড")}</p>
            <p>{t("Main Wallet :", "মূল ওয়ালেট :")} <span className="text-gray-800 font-bold">৳ {balance.toLocaleString()}</span></p>
            <p>{t("Available Amount :", "উপলব্ধ পরিমাণ :")} <span className="text-gray-800 font-bold">৳ {balance.toLocaleString()}</span></p>
            <p>{t("Turnover:", "টার্নওভার:")} <span className={isTurnoverComplete ? "text-green-600" : "text-red-600"}>{compTurnover.toLocaleString()} / {reqTurnover.toLocaleString()}</span></p>
          </div>

          {/* রিফ্রেশ বাটন */}
          <div className="flex justify-center mb-6">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {t("Refresh Balance", "ব্যালেন্স রিফ্রেশ করুন")}
            </button>
          </div>

          {/* ফর্ম */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <label className="text-gray-700 text-sm font-medium mb-2 block">{t("Withdrawal Amount:", "উত্তোলনের পরিমাণ:")}</label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition w-full">
                <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300">{t("Amount", "পরিমাণ")}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100 ~ 25,000"
                  className="flex-1 bg-transparent text-black py-1 px-4 outline-none w-full"
                  required
                />
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition w-full">
                <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300 w-32 leading-tight">{t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}
                  className="flex-1 bg-transparent text-black py-1 px-4 outline-none w-full"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 px-2">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center w-full">
                {message}
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg text-center w-full">
                {t("Withdrawal Request Submitted Successfully!", "উত্তোলন রিকোয়েস্ট সফলভাবে জমা হয়েছে!")}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !isTurnoverComplete || isSuccess || savedWallets.length === 0 || !amount || !password}
              className={`w-full font-bold text-lg py-3 rounded-lg mt-4 transition-colors flex justify-center items-center ${
                isTurnoverComplete && amount && password && savedWallets.length > 0
                  ? "bg-[#007BFF] hover:bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                t("Submit", "সাবমিট")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
