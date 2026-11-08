"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import "./withdrawal-loader.css"; // নতুন লোডার ইমপোর্ট

export default function WithdrawalPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [balance, setBalance] = useState(0);
  const [reqTurnover, setReqTurnover] = useState(0);
  const [compTurnover, setCompTurnover] = useState(0);
  const [txnPasswordDb, setTxnPasswordDb] = useState<string | null>(null);
  
  // ডাইনামিক লিমিট স্টেট
  const [minWithdrawal, setMinWithdrawal] = useState(100);
  const [maxWithdrawal, setMaxWithdrawal] = useState(25000);

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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/user/login");
        return;
      }

      // ১. প্রোফাইল ডাটা
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

      // ২. অ্যাডমিন সেটিংস থেকে লিমিট আনা
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("min_withdrawal, max_withdrawal")
        .eq("id", 1)
        .single();

      if (settings) {
        setMinWithdrawal(Number(settings.min_withdrawal) || 100);
        setMaxWithdrawal(Number(settings.max_withdrawal) || 25000);
      }

      // ৩. ই-ওয়ালেট ডাটা
      const { data: wallets } = await supabase
        .from("user_payment_type_store")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (wallets) setAllWallets(wallets);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // শুধু ব্যালেন্স এবং টার্নওভার রিফ্রেশ করার ফাংশন
  const refreshBalanceOnly = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, total_required_turnover, total_completed_turnover")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setBalance(Number(profile.balance) || 0);
      setReqTurnover(Number(profile.total_required_turnover) || 0);
      setCompTurnover(Number(profile.total_completed_turnover) || 0);
    }
  };

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
    if (numericAmount < minWithdrawal) {
      setMessage(t(`Minimum withdrawal is ${minWithdrawal} BDT.`, `সর্বনিম্ন উইথড্র ${minWithdrawal} টাকা।`));
      return;
    }
    if (numericAmount > maxWithdrawal) {
      setMessage(t(`Maximum withdrawal is ${maxWithdrawal.toLocaleString()} BDT.`, `সর্বোচ্চ উইথড্র ${maxWithdrawal.toLocaleString()} টাকা।`));
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

  const isTurnoverComplete = compTurnover >= reqTurnover;

  const maskNumber = (num: string) => {
    if (!num) return "";
    return "*******" + num.slice(-4);
  };

  // ==========================================
  // নতুন উইথড্র ভিত্তিক সাদা লোডিং এনিমেশন
  // ==========================================
  if (loading) {
    return (
      <div className="withdrawal-loader-container">
        <svg 
          className="withdrawal-loader-svg" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {/* মানি / ব্যাংকনোট আইকন */}
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10 font-sans text-gray-800 overflow-x-hidden w-full max-w-full">
      
      {/* Top Bar */}
      <header className="bg-[#1475E0] px-4 py-4 flex items-center justify-between sticky top-0 z-50 w-full">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-white">{t("Withdrawal", "উত্তোলন")}</h1>
        <button onClick={() => router.push("/wallets/withdrawal-report")} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </button>
      </header>

      {/* ট্যাব */}
      <div className="flex border-b border-gray-200 w-full overflow-hidden">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex-1 py-3 text-center text-[11px] transition-all flex items-center justify-center gap-1 ${
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
        
        {/* E-wallet সেকশন */}
        <div className="mb-6 relative w-full">
          <h3 className="text-gray-700 text-[11px] font-medium mb-3">
            {t("Registered E-wallet", "রেজিস্টার্ড ই-ওয়ালেট")} ({savedWallets.length}/5)
          </h3>
          
          {savedWallets.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
              {savedWallets.map((wallet) => (
                <div key={wallet.id} className="relative min-w-[90vw] sm:min-w-[320px] flex-shrink-0 snap-center bg-gradient-to-br from-[#7B5CFF] to-[#00D4FF] rounded-2xl p-5 text-white shadow-lg overflow-hidden h-[170px] flex flex-col justify-between">
                  
                  <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="20" opacity="0.5"/>
                      <circle cx="100" cy="100" r="120" stroke="white" strokeWidth="20" opacity="0.3"/>
                      <circle cx="100" cy="100" r="160" stroke="white" strokeWidth="20" opacity="0.1"/>
                    </svg>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 p-1.5 rounded-md backdrop-blur-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <span className="font-semibold text-lg tracking-wide">{selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}</span>
                  </div>

                  <div className="relative z-10">
                    <p className="text-xl font-bold tracking-[0.15em] mb-1">{maskNumber(wallet.account_number)}</p>
                    <p className="text-[11px] text-white/80 font-medium">
                      {new Date(wallet.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative border border-gray-100 bg-[#F8F9FA] rounded-2xl h-[170px] flex flex-col items-center justify-center w-full overflow-hidden">
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
              <span className="text-gray-400 text-[11px] font-medium relative z-10 mt-10">
                {t("No E-Wallet linked yet", "এখনও কোনো ই-ওয়ালেট যুক্ত করা হয়নি")}
              </span>
            </div>
          )}

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
          
          {/* ইনফরমেশন & টার্নওভার হাইলাইট (গ্রিড আকারে) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col justify-center">
              <span className="text-gray-500 text-[11px] mb-1">{t("Main Wallet", "মূল ওয়ালেট")}</span>
              <strong className="text-gray-900 text-sm">৳ {balance.toLocaleString()}</strong>
            </div>
            
            <div className={`border rounded-lg p-3 flex flex-col justify-center ${isTurnoverComplete ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <span className={`text-[11px] mb-1 ${isTurnoverComplete ? 'text-green-600' : 'text-orange-500'}`}>{t("Turnover", "টার্নওভার")}</span>
              <strong className={`text-sm ${isTurnoverComplete ? 'text-green-700' : 'text-orange-600'}`}>
                {compTurnover.toLocaleString()} / {reqTurnover.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-4 text-[11px] text-gray-500">
            <p>{t("Withdrawal time: 24 Hours", "উত্তোলনের সময়: ২৪ ঘন্টা")}</p>
            <p>{t("Daily withdrawal Unlimited", "দৈনিক উত্তোলন আনলিমিটেড")}</p>
            <p>{t("Available Amount :", "উপলব্ধ পরিমাণ :")} <span className="text-gray-800 font-bold">৳ {balance.toLocaleString()}</span></p>
          </div>

          {/* রিফ্রেশ বাটন (পেজ রিলোড ছাড়া) */}
          <div className="flex justify-center mb-6">
            <button 
              onClick={refreshBalanceOnly}
              className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 hover:bg-blue-100 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {t("Refresh Balance", "ব্যালেন্স রিফ্রেশ করুন")}
            </button>
          </div>

          {/* ফর্ম */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <label className="text-gray-700 text-[11px] font-medium mb-2 block">{t("Withdrawal Amount:", "উত্তোলনের পরিমাণ:")}</label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition w-full">
                <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300 text-[11px]">{t("Amount", "পরিমাণ")}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${minWithdrawal} ~ ${maxWithdrawal.toLocaleString()}`}
                  className="flex-1 bg-transparent text-black py-1 px-4 outline-none w-full text-[11px]"
                  required
                />
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition w-full">
                <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300 w-32 leading-tight text-[11px]">{t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}
                  className="flex-1 bg-transparent text-black py-1 px-4 outline-none w-full text-[11px]"
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
              <div className="bg-red-50 border border-red-200 text-red-600 text-[11px] p-3 rounded-lg text-center w-full">
                {message}
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-[11px] p-3 rounded-lg text-center w-full">
                {t("Withdrawal Request Submitted Successfully!", "উত্তোলন রিকোয়েস্ট সফলভাবে জমা হয়েছে!")}
              </div>
            )}

            {/* নতুন ৩ডি গ্লসি সাবমিট বাটন */}
            <button
              type="submit"
              disabled={submitting || !isTurnoverComplete || isSuccess || savedWallets.length === 0 || !amount || !password}
              className={`w-full font-bold text-[14px] py-3 rounded-full mt-4 transition-all flex justify-center items-center text-white
                ${isTurnoverComplete && amount && password && savedWallets.length > 0
                  ? "bg-gradient-to-b from-[#34f05f] to-[#1a9e4c] border border-[#117934] shadow-[inset_0_3px_5px_rgba(255,255,255,0.6),inset_0_-4px_6px_rgba(0,0,0,0.3),0_5px_0_#117934,0_8px_15px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2),0_1px_0_#117934,0_4px_8px_rgba(0,0,0,0.3)]" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
