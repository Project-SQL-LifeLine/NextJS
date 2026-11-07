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
  const [selectedMethod, setSelectedMethod] = useState("bkash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // মেথড লিস্ট (ভবিষ্যতে ডাটাবেস থেকে আনতে পারেন)
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
      setMessage("আপনার টার্নওভার সম্পূর্ণ হয়নি। টার্নওভার শেষ না করে উইথড্র করা যাবে না।");
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

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // ডাটাবেসে উইথড্র রিকোয়েস্ট পাঠানো
      const { error } = await supabase.from("user_deposit_transaction").insert({
        user_id: session.user.id,
        transaction_type: "withdrawal",
        method_code: selectedMethod,
        amount: numericAmount,
        status: "pending",
      });

      if (error) throw error;

      // ব্যালেন্স কেটে নেওয়া (অপশনাল: এটা ট্রিগার দিয়েও করা যেতে পারে)
      await supabase.from("profiles").update({ balance: balance - numericAmount }).eq("id", session.user.id);

      setIsSuccess(true);
      setBalance(balance - numericAmount); // লোকাল স্টেট আপডেট
      setAmount("");
      
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
      {/* Header */}
      <header className="bg-[#1A2C38] px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-[#2F4553]">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">Withdrawal</h1>
        <Link href="/wallets/voucher-report" className="text-white hover:text-[#00E701]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </Link>
      </header>

      <div className="p-4 flex flex-col gap-6">
        
        {/* ব্যালেন্স এবং টার্নওভার কার্ড */}
        <div className="bg-[#1A2C38] rounded-xl p-4 border border-[#2F4553]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[#B1BAD3] text-xs">Main Wallet</p>
              <h2 className="text-white text-xl font-bold">৳ {balance.toLocaleString()}</h2>
            </div>
            <button className="bg-[#00E701]/10 text-[#00E701] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
          
          <div className="border-t border-[#2F4553] pt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#B1BAD3]">Turnover Progress</span>
              <span className={isTurnoverComplete ? "text-[#00E701]" : "text-[#ED4163]"}>
                {compTurnover.toLocaleString()} / {reqTurnover.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-[#0F212E] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isTurnoverComplete ? "bg-[#00E701]" : "bg-[#ED4163]"}`} 
                style={{ width: `${reqTurnover === 0 ? 100 : Math.min((compTurnover / reqTurnover) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* মেথড সিলেকশন */}
        <div>
          <h3 className="text-white text-sm font-bold mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-3 gap-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`py-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedMethod === method.id 
                    ? "border-[#00E701] bg-[#00E701]/10 text-[#00E701]" 
                    : "border-[#2F4553] bg-[#1A2C38] text-[#B1BAD3]"
                }`}
              >
                {method.name}
              </button>
            ))}
          </div>
        </div>

        {/* ফর্ম */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-2 block">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B1BAD3] font-bold">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100 ~ 25,000"
                className="w-full bg-[#1A2C38] text-white border border-[#2F4553] rounded-lg pl-10 pr-4 py-3 text-lg font-bold focus:outline-none focus:border-[#00E701]"
                required
              />
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

          <button
            type="submit"
            disabled={submitting || !isTurnoverComplete || isSuccess}
            className={`w-full font-bold text-lg py-3 rounded-lg mt-2 transition-colors flex justify-center items-center ${
              isTurnoverComplete 
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
  );
}
