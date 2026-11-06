"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase/client";

export default function VoucherCenterPage() {
  const router = useRouter();

  // স্টেট
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPromo, setSelectedPromo] = useState("none");

  // ডাটাবেস থেকে আসা ডাটা
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ডেমো বোনাস (পরে bonus_settings টেবিল থেকে আসবে)
  const promotions = [
    { id: "bonus1", code: "VS03", label: "ডিসকাউন্ট কোড: VS03 (2/2)", minAmount: 200, percent: "150%" },
    { id: "bonus2", code: "VS08", label: "ডিসকাউন্ট কোড: VS08", minAmount: 100, percent: "250%" },
  ];

  useEffect(() => {
    const fetchMethods = async () => {
      setLoading(true);
      // control_payment_method টেবিল থেকে চালু থাকা মেথডগুলো আনা
      const { data, error } = await supabase
        .from("control_payment_method")
        .select("*")
        .eq("is_active", true);

      if (data && data.length > 0) {
        setMethods(data);
        setSelectedMethod(data[0]); // ডিফল্ট প্রথমটি সিলেক্ট
        setSelectedChannel(data[0].payment_channels[0]); // ডিফল্ট প্রথম চ্যানেল
      } else {
        // যদি ডাটাবেস খালি থাকে, তবে ডেমো দেখাবে (যাতে ডিজাইন ভেঙে না যায়)
        const fallback = [
          { id: "1", method_name: "Send Money Bkash", method_logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png", payment_channels: ["HRPAY", "MEGIpay", "TKPAY"], min_deposit: 500, max_deposit: 30000 },
          { id: "2", method_name: "NAGAD", method_logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nagad_Logo.svg/512px-Nagad_Logo.svg.png", payment_channels: ["HRPAY", "MEGIpay"], min_deposit: 500, max_deposit: 30000 },
          { id: "3", method_name: "Rocket", method_logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Rocket_Logo.svg/512px-Rocket_Logo.svg.png", payment_channels: ["HRPAY"], min_deposit: 500, max_deposit: 30000 },
          { id: "4", method_name: "Upay", method_logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Upay_Logo.svg/512px-Upay_Logo.svg.png", payment_channels: ["HRPAY", "MEGIpay"], min_deposit: 500, max_deposit: 30000 }
        ];
        setMethods(fallback);
        setSelectedMethod(fallback[0]);
        setSelectedChannel(fallback[0].payment_channels[0]);
      }
      setLoading(false);
    };

    fetchMethods();
  }, []);

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    setSelectedChannel(method.payment_channels[0]); // চ্যানেল পরিবর্তন হলে ডিফল্ট চ্যানেল সেট হবে
  };

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2F4553] border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain text-textMain flex flex-col pb-20">
      
      {/* Header */}
      <header className="bg-bgSec px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-borderCol">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">Deposit</h1>
        <button className="text-white relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">2</span>
        </button>
      </header>

      <div className="p-4 flex flex-col gap-6">
        
        {/* ১. Deposit Method (৪ কলামের গ্রিড) */}
        <section>
          <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Deposit Method
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                  selectedMethod?.id === method.id ? "border-danger bg-danger/10" : "border-borderCol bg-bgSec"
                }`}
              >
                <img src={method.method_logo_url} alt={method.method_name} className="w-10 h-10 object-contain mb-1" />
                <span className={`text-[10px] font-semibold text-center leading-tight ${selectedMethod?.id === method.id ? "text-danger" : "text-white"}`}>
                  {method.method_name}
                </span>
                {selectedMethod?.id === method.id && (
                  <div className="absolute -bottom-1.5 -right-1.5 bg-danger text-white rounded-full p-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ২. Payment Channel */}
        <section>
          <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Payment Channel
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {selectedMethod?.payment_channels?.map((channel: string) => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                  selectedChannel === channel ? "border-danger text-danger bg-danger/10" : "border-borderCol text-textSec bg-bgSec"
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </section>

        {/* Notice Text */}
        <p className="text-xs text-textSec leading-relaxed">
          ডিপোজিট তথ্য: বারবার ডিপোজিট পেমেন্ট এড়াতে ডিপোজিট করার সময় শুধুমাত্র একবার পেমেন্ট করুন।
        </p>

        {/* ৩. Deposit Amounts */}
        <section>
          <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger inline-block"></span> Deposit Amounts
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[500, 1000, 2000, 5000, 10000, 20000, 30000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleAmountClick(amt)}
                className={`py-3 rounded-lg border-2 font-bold transition-all ${
                  selectedAmount === amt ? "border-danger text-danger" : "border-borderCol text-textSec"
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSec font-bold">৳</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(Number(e.target.value));
              }}
              placeholder={`${selectedMethod?.min_deposit || 500} - ${selectedMethod?.max_deposit || 30000}`}
              className="w-full bg-bgSec text-white border-2 border-borderCol rounded-lg pl-10 pr-4 py-3 text-lg font-bold focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </section>

        {/* ৪. Promotions */}
        <section>
          <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Promotions
          </h2>
          <div className="flex flex-col gap-3">
            {promotions.map((promo) => (
              <label key={promo.id} className="flex items-center justify-between p-4 rounded-lg border border-borderCol cursor-pointer hover:bg-bgSec/50">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="promo"
                    value={promo.id}
                    checked={selectedPromo === promo.id}
                    onChange={() => setSelectedPromo(promo.id)}
                    className="w-5 h-5 accent-danger"
                  />
                  <span className="text-sm font-semibold text-textSec">{promo.label}</span>
                </div>
                <span className="text-xs text-textSec">≥ ৳ {promo.minAmount}</span>
              </label>
            ))}
            
            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedPromo === "none" ? "border-primary bg-primary/5" : "border-borderCol hover:bg-bgSec/50"
            }`}>
              <input
                type="radio"
                name="promo"
                value="none"
                checked={selectedPromo === "none"}
                onChange={() => setSelectedPromo("none")}
                className="w-5 h-5 accent-primary"
              />
              <span className="text-sm font-bold text-white">Do not participate in any promotions</span>
            </label>
          </div>
        </section>
      </div>

      {/* Next Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-bgMain border-t border-borderCol">
        <Link href={`/wallets/voucher-center/depositIframe?method=${selectedMethod?.method_name}&amount=${customAmount}`} className="w-full block text-center bg-primary text-[#071A0B] font-bold text-lg py-3 rounded-lg hover:bg-[#00c701] transition-colors">
          Next
        </Link>
      </div>
    </div>
  );
}
