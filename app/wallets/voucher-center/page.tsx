"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase/client";
import Head from "next/head"; 

const ThumbsUpIcon = () => (
  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.1-.66-.32-.51-.94-.66-1.47-.36L7.25 6.86C7.09 6.95 7 7.12 7 7.3V19c0 .55.45 1 1 1h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.72z" />
  </svg>
);

export default function VoucherCenterPage() {
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPromo, setSelectedPromo] = useState("none");

  const [methods, setMethods] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // পেজ ফেড অ্যানিমেশনের জন্য স্টেট
  const [isFadeIn, setIsFadeIn] = useState(false);

  useEffect(() => {
    // ফেড ইন এফেক্ট
    const timer = setTimeout(() => setIsFadeIn(true), 100);

    const fetchData = async () => {
      setLoading(true);
      
      const { data: methodsData } = await supabase
        .from("control_payment_method")
        .select("*")
        .eq("is_active", true);

      const { data: bonusesData } = await supabase
        .from("bonus_settings")
        .select("*")
        .eq("is_active", true);

      if (methodsData && methodsData.length > 0) {
        setMethods(methodsData);
        setSelectedMethod(methodsData[0]);
        setSelectedChannel(methodsData[0].payment_channels[0]);
      }

      if (bonusesData) {
        setBonuses(bonusesData);
      }

      setLoading(false);
    };

    fetchData();

    return () => clearTimeout(timer);
  }, []);

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    setSelectedChannel(method.payment_channels[0]);
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
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* ফেড-ইন এফেক্টসহ মূল কন্টেইনার */}
      <div className={`min-h-screen bg-bgMain text-textMain flex flex-col pb-20 transition-opacity duration-700 ease-in-out ${isFadeIn ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Header */}
        <header className="bg-bgSec px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-borderCol">
          <button onClick={() => router.back()} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-white">Deposit</h1>
          
          {/* খাতার আইকন যা রিপোর্ট পেজে নিয়ে যাবে */}
          <Link href="/wallets/voucher-report" className="text-white relative hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </Link>
        </header>

        {/* জুম ০.৭৫ করা হয়েছে (আগে ০.৬ ছিল) */}
        <div className="p-4 flex flex-col gap-6" style={{ zoom: "0.75" }}>
          
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
                  <div className="absolute top-0 left-0 p-1 rounded-br-lg bg-danger">
                    <ThumbsUpIcon />
                  </div>
                  <img src={method.method_logo_url} alt={method.method_name} className="w-10 h-10 object-contain mb-1 mt-3" />
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

          <section>
            <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Payment Channel
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {selectedMethod?.payment_channels?.map((channel: string) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`relative p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                    selectedChannel === channel ? "border-danger text-danger bg-danger/10" : "border-borderCol text-textSec bg-bgSec"
                  }`}
                >
                  <div className="absolute top-0 left-0 p-1 rounded-br-lg bg-danger">
                    <ThumbsUpIcon />
                  </div>
                  {channel}
                </button>
              ))}
            </div>
          </section>

          <p className="text-xs text-textSec leading-relaxed">
            ডিপোজিট তথ্য: বারবার ডিপোজিট পেমেন্ট এড়াতে ডিপোজিট করার সময় শুধুমাত্র একবার পেমেন্ট করুন।
          </p>

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

          <section>
            <h2 className="text-sm font-bold text-textSec mb-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Promotions
            </h2>
            <div className="flex flex-col gap-3">
              {bonuses.map((bonus) => (
                <label key={bonus.id} className="flex items-center justify-between p-4 rounded-lg border border-borderCol cursor-pointer hover:bg-bgSec/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="promo"
                      value={bonus.id}
                      checked={selectedPromo === bonus.id.toString()}
                      onChange={() => setSelectedPromo(bonus.id.toString())}
                      className="w-5 h-5 accent-danger"
                    />
                    <span className="text-sm font-semibold text-textSec">{bonus.bonus_name}</span>
                  </div>
                  <span className="text-xs text-textSec">{bonus.bonus_percentage}% (x{bonus.turnover_multiplier})</span>
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

        <div className="fixed bottom-0 left-0 w-full p-4 bg-bgMain border-t border-borderCol">
          <Link href={`/wallets/voucher-center/depositIframe?method=${selectedMethod?.method_name}&amount=${customAmount}`} className="w-full block text-center bg-primary text-[#071A0B] font-bold text-lg py-3 rounded-lg hover:bg-[#00c701] transition-colors">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
