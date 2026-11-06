"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VoucherCenterPage() {
  const router = useRouter();

  // স্টেট
  const [selectedMethod, setSelectedMethod] = useState("bkash_send");
  const [selectedChannel, setSelectedChannel] = useState("HRPAY");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPromo, setSelectedPromo] = useState("none");

  // ডেমো ডাটা (পরে Supabase control_payment_method টেবিল থেকে আসবে)
  const depositMethods = [
    { id: "bkash_send", name: "Send Money Bkash", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png" },
    { id: "bkash_personal", name: "Bkash", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png" },
    { id: "nagad_send", name: "NAGAD", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nagad_Logo.svg/512px-Nagad_Logo.svg.png" },
  ];

  const channels = ["HRPAY", "MEGIpay", "TKPAY"];
  const amounts = [500, 1000, 2000, 5000, 10000, 20000, 30000];

  // ডেমো বোনাস (পরে bonus_settings টেবিল থেকে আসবে)
  const promotions = [
    { id: "bonus1", code: "VS03", label: "ডিসকাউন্ট কোড: VS03 (2/2)", minAmount: 200, percent: "150%" },
    { id: "bonus2", code: "VS08", label: "ডিসকাউন্ট কোড: VS08", minAmount: 100, percent: "250%" },
  ];

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

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
        
        {/* ১. Deposit Method */}
        <section>
          <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Deposit Method
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {depositMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id ? "border-danger bg-danger/10" : "border-borderCol bg-bgSec"
                }`}
              >
                <img src={method.logo} alt={method.name} className="w-10 h-10 object-contain mb-2" />
                <span className={`text-xs font-semibold text-center ${selectedMethod === method.id ? "text-danger" : "text-white"}`}>{method.name}</span>
                {selectedMethod === method.id && (
                  <div className="absolute -bottom-2 -right-2 bg-danger text-white rounded-full p-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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
            {channels.map((channel) => (
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
            {amounts.map((amt) => (
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
              placeholder="500 - 30,000"
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
        <button className="w-full bg-primary text-[#071A0B] font-bold text-lg py-3 rounded-lg hover:bg-[#00c701] transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}
