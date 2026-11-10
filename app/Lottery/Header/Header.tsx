"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function LotteryHeader() {
  const router = useRouter();
  const { t } = useLanguage();
  const [lotteryBalance, setLotteryBalance] = useState<number>(0);

  useEffect(() => {
    const fetchLotteryBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("lottery_balance")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setLotteryBalance(data.lottery_balance || 0);
        }
      }
    };
    fetchLotteryBalance();
  }, []);

  return (
    <header className="lottery-header">
      <div className="lottery-header-left">
        {/* Back Button - মেইন অ্যাপে ফেরত যাওয়ার জন্য */}
        <button onClick={() => router.push("/")} className="lottery-back-btn">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Lottery Logo */}
        <div className="lottery-logo">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          {t("Lucky Draw", "লাকি ড্র")}
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="lottery-wallet">
        <svg className="w-4 h-4 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span>৳ {lotteryBalance.toFixed(2)}</span>
      </div>
    </header>
  );
}
