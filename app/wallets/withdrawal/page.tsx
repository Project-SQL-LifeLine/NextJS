"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase/client";

export default function WithdrawalPage() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [reqTurnover, setReqTurnover] = useState(0);
  const [compTurnover, setCompTurnover] = useState(0);
  
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [selectedMethod, setSelectedMethod] = useState("bkash");
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
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/user/login");
        return;
      }

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
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const numericAmount = Number(amount);

    if (reqTurnover > compTurnover) {
      setMessage("আপনার টার্নওভার সম্পূর্ণ হয়নি।");
      return;
    }
    if (numericAmount < 100) {
      setMessage("সর্বনিম্ন উইথড্র ১০০ টাকা।");
      return;
    }
    if (numericAmount > balance) {
      setMessage("আপনার পর্যাপ্ত ব্যালেন্স নেই।");
      return;
    }
    if (!password) {
      setMessage("ট্রানজেকশন পাসওয়ার্ড দিন।");
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
      });

      if (error) throw error;

      await supabase.from("profiles").update({ balance: balance - numericAmount }).eq("id", session.user.id);

      setIsSuccess(true);
      setBalance(balance - numericAmount);
      setAmount("");
      setPassword("");
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setMessage(err.message || "উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F212E] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2F4553] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isTurnoverComplete = compTurnover >= reqTurnover;

  return (
    <div className="min-h-screen bg-[#0F212E] pb-10">
      
      {/* ১. হেডার */}
      <header className="bg-[#0d2b45] px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-[#2F4553]">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">Withdrawal</h1>
        <Link href="/wallets/voucher-report" className="text-white hover:text-[#00E701]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </Link>
      </header>

      <div className="flex flex-col">
        
        {/* ২. মেথড ট্যাব (bKash, Nagad, Rocket) */}
        <div className="flex border-b border-[#2F4553] bg-[#1A2C38]">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center ${
                selectedMethod === method.id 
                  ? "text-white border-b-2 border-[#00E701] bg-[#253B49]" 
                  : "text-[#B1BAD3]"
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: method.color }}
              ></span>
              {method.name}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ৩. Registered E-wallet */}
          <div className="mb-6">
            <h3 className="text-[#B1BAD3] text-sm font-semibold mb-2">Registered E-wallet (0/5)</h3>
            
            <div className="relative border border-[#2F4553] rounded-xl bg-[#1A2C38] h-48 flex flex-col items-center justify-center overflow-hidden">
              {/* ডামি কার্ড ভেক্টর (SVG) */}
              <svg className="w-24 h-24 text-[#2F4553] mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
              <span className="text-[#B1BAD3] text-sm font-medium">No E-Wallet linked yet</span>

              {/* প্লাস বাটন (লাল) */}
              <button 
                onClick={() => alert("Coming soon: E-wallet linking page")}
                className="absolute bottom-4 right-4 w-12 h-12 bg-[#ED4163] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          {/* ৪. ইনফরমেশন টেক্সট */}
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-[#B1BAD3] text-sm">Withdrawal time: <span className="text-white">06:00 - 22:00</span></p>
            <p className="text-[#B1BAD3] text-sm">Daily withdrawal 99,999,999 (Times), Remaining 99,999,999 (Times)</p>
            <p className="text-[#B1BAD3] text-sm">Main Wallet : <span className="text-white font-bold">৳ {balance.toLocaleString()}</span></p>
            <p className="text-[#B1BAD3] text-sm">Available Amount : <span className="text-white font-bold">৳ {balance.toLocaleString()}</span></p>
            <p className="text-[#B1BAD3] text-xs mt-1">Turnover: <span className={isTurnoverComplete ? "text-[#00E701]" : "text-[#ED4163]"}>{compTurnover.toLocaleString()} / {reqTurnover.toLocaleString()}</span></p>
          </div>

          {/* ৫. রিফ্রেশ বাটন */}
          <div className="flex justify-center mb-6">
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#1475E0]/20 text-[#1475E0] px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#1475E0]/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Balance
            </button>
          </div>

          {/* ৬. ফর্ম (Withdrawal Amount & Password) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div>
              <label className="text-white text-sm font-semibold mb-2 block">Withdrawal Amount:</label>
              <div className="flex items-center bg-[#1A2C38] border border-[#2F4553] rounded-lg p-1 focus-within:border-[#00E701] transition">
                <span className="text-[#B1BAD3] font-semibold pl-3 pr-2">Amount</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100 ~ 25,000"
                  className="flex-1 bg-transparent text-white py-3 px-2 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center bg-[#1A2C38] border border-[#2F4553] rounded-lg p-1 focus-within:border-[#00E701] transition">
                <span className="text-[#B1BAD3] font-semibold pl-3 pr-2">Transaction Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-white py-3 px-2 outline-none"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#B1BAD3] px-3"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div className="bg-[#ED4163]/20 border border-[#ED4163] text-[#ED4163] text-sm p-3 rounded-lg text-center">
                {message}
              </div>
            )}

            {isSuccess && (
              <div className="bg-[#00E701]/20 border border-[#00E701] text-[#00E701] text-sm p-3 rounded-lg text-center">
                Withdrawal Request Submitted Successfully!
              </div>
            )}

            {/* সাবমিট বাটন (ছবির মতো ডিজেবল অবস্থা) */}
            <button
              type="submit"
              disabled={submitting || !isTurnoverComplete || isSuccess || !amount || !password}
              className={`w-full font-bold text-lg py-3 rounded-lg mt-4 transition-colors flex justify-center items-center ${
                isTurnoverComplete && amount && password
                  ? "bg-[#00E701] hover:bg-[#00c701] text-[#071A0B]" 
                  : "bg-[#2F4553] text-[#B1BAD3] cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
