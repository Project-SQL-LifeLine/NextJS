"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function WithdrawalPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // স্টেট
  const [balance, setBalance] = useState(0);
  const [reqTurnover, setReqTurnover] = useState(0);
  const [compTurnover, setCompTurnover] = useState(0);
  const [txnPasswordDb, setTxnPasswordDb] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState("bkash");
  const [savedWallets, setSavedWallets] = useState<any[]>([]);
  
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // নতুন ওয়ালেট অ্যাড করার জন্য স্টেট
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletNumber, setNewWalletNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const methods = [
    { id: "bkash", name: "bKash", color: "#D12053" },
    { id: "nagad", name: "Nagad", color: "#F63" },
    { id: "rocket", name: "Rocket", color: "#8C3494" }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMethod]);

  const fetchData = async () => {
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
      .eq("method_code", selectedMethod)
      .eq("is_active", true);

    if (wallets) setSavedWallets(wallets);
    setLoading(false);
  };

  const handleAddWallet = async () => {
    if (!/^01[0-9]{9}$/.test(newWalletNumber)) {
      alert(t("Please enter a valid 11 digit mobile number (e.g. 017XXXXXXXX)", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)"));
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("user_payment_type_store").insert({
      user_id: session.user.id,
      method_code: selectedMethod,
      account_number: newWalletNumber
    });

    if (error) {
      alert(t("Failed to save number!", "নাম্বার সেভ করতে সমস্যা হয়েছে!"));
    } else {
      setNewWalletNumber("");
      setIsAddingWallet(false);
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const numericAmount = Number(amount);

    if (savedWallets.length === 0) {
      setMessage(t("Please add an e-wallet number first.", "অনুগ্রহ করে প্রথমে একটি ই-ওয়ালেট নাম্বার যুক্ত করুন।"));
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
    } else if (!txnPasswordDb) {
      await supabase.from("profiles").update({ transaction_password: password }).eq("id", (await supabase.auth.getSession()).data.session?.user.id);
      setTxnPasswordDb(password);
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

  return (
    <div className="min-h-screen bg-white pb-10 font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-[#0A2C6B] px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-white">{t("Withdrawal", "উত্তোলন")}</h1>
        <button onClick={() => router.push("/wallets/voucher-report")} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </button>
      </header>

      {/* ট্যাব */}
      <div className="flex border-b border-gray-200">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center ${
              selectedMethod === method.id 
                ? "text-red-600 border-b-2 border-red-600" 
                : "text-gray-500"
            }`}
          >
            {method.name}
          </button>
        ))}
      </div>

      <div className="p-4">
        
        {/* E-wallet সেকশন */}
        <div className="mb-6">
          <h3 className="text-gray-700 text-base font-medium mb-3">
            {t("Registered E-wallet", "রেজিস্টার্ড ই-ওয়ালেট")} ({savedWallets.length}/5)
          </h3>
          
          {savedWallets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {savedWallets.map((wallet) => (
                <div key={wallet.id} className="border border-blue-400 rounded-lg p-3 bg-blue-50 flex items-center gap-3">
                  <input type="radio" checked readOnly className="w-4 h-4 accent-blue-600" />
                  <span className="font-bold text-gray-800">{wallet.account_number}</span>
                </div>
              ))}
              <button 
                onClick={() => setIsAddingWallet(true)}
                className="text-blue-600 text-sm font-semibold mt-2 text-left"
              >
                + {t("Add another wallet", "আরেকটি ওয়ালেট যুক্ত করুন")}
              </button>
            </div>
          ) : (
            <div className="relative border border-gray-200 rounded-lg bg-gray-50 h-48 flex flex-col items-center justify-center">
              <svg className="w-20 h-20 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <span className="text-gray-400 text-sm">{t("No E-Wallet linked yet", "এখনও কোনো ই-ওয়ালেট যুক্ত করা হয়নি")}</span>
              <button 
                onClick={() => setIsAddingWallet(true)}
                className="absolute bottom-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* নতুন ওয়ালেট অ্যাড ফর্ম */}
        {isAddingWallet && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              {t(`Add ${selectedMethod.toUpperCase()} Number`, `${selectedMethod.toUpperCase()} নম্বর যুক্ত করুন`)}
            </label>
            <input
              type="text"
              value={newWalletNumber}
              onChange={(e) => setNewWalletNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full border border-gray-300 rounded p-2 mb-3 text-black"
            />
            <div className="flex gap-2">
              <button onClick={handleAddWallet} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold flex-1">
                {t("Save", "সেভ করুন")}
              </button>
              <button onClick={() => setIsAddingWallet(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-bold flex-1">
                {t("Cancel", "বাতিল")}
              </button>
            </div>
          </div>
        )}

        {/* ইনফরমেশন */}
        <div className="flex flex-col gap-2 mb-6 text-sm text-gray-500">
          <p>{t("Withdrawal time:", "উত্তোলনের সময়:")} <span className="text-gray-800">06:00 - 22:00</span></p>
          <p>{t("Daily withdrawal 99,999,999 (Times), Remaining 99,999,999 (Times)", "দৈনিক উত্তোলন ৯৯,৯৯৯,৯৯৯ (বার), অবশিষ্ট ৯৯,৯৯৯,৯৯৯ (বার)")}</p>
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="text-gray-700 text-sm font-medium mb-2 block">{t("Withdrawal Amount:", "উত্তোলনের পরিমাণ:")}</label>
            <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition">
              <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300">{t("Amount", "পরিমাণ")}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100 ~ 25,000"
                className="flex-1 bg-transparent text-black py-1 px-4 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:border-blue-500 transition">
              <span className="text-gray-500 font-semibold pr-4 border-r border-gray-300 w-32 leading-tight">{t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Transaction Password", "ট্রানজেকশন পাসওয়ার্ড")}
                className="flex-1 bg-transparent text-black py-1 px-4 outline-none"
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
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
              {message}
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg text-center">
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
  );
}
