"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import "./Secure-cashout-activity.css";

export default function SecureCashoutActivityPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  
  // ফ্লো স্টেট
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // ১. ৩ সেকেন্ডের সিকিউরিটি লোডিং
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 3000);

    // ইউজার ডাটা লোড
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchUser();

    return () => clearTimeout(timer);
  }, []);

  const handleVerify = () => {
    if (!check1 || !check2) return;

    setIsVerifying(true);
    
    // ২. ২.৫ সেকেন্ডের ভেরিফিকেশন লোডিং
    setTimeout(() => {
      router.push("/Lottery/fee-payment"); // ফি পেজে রিডাইরেক্ট
    }, 2500);
  };

  // ৩ সেকেন্ডের লোডার
  if (isPageLoading) {
    return (
      <div className="cashout-page">
        <LotteryHeader userProfile={profile} />
        <div className="loader-container">
          <svg className="loader-shield" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-[#F5B041] text-sm font-bold animate-pulse">
            {t("Establishing Secure Connection...", "সুরক্ষিত সংযোগ তৈরি হচ্ছে...")}
          </p>
        </div>
      </div>
    );
  }

  // ২.৫ সেকেন্ডের ভেরিফাইং লোডার
  if (isVerifying) {
    return (
      <div className="cashout-page">
        <LotteryHeader userProfile={profile} />
        <div className="loader-container">
          <div className="w-10 h-10 border-4 border-[#F5B041] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#F5B041] text-sm font-bold mt-4">
            {t("Verifying Payment Method...", "পেমেন্ট মেথড যাচাই করা হচ্ছে...")}
          </p>
        </div>
      </div>
    );
  }

  // মেইন চেকলিস্ট ভিউ
  return (
    <div className="cashout-page pb-20">
      <LotteryHeader userProfile={profile} />

      <main className="cashout-main">
        <div className="form-card">
          <h3 className="form-title">
            <svg className="w-5 h-5 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t("Security Verification Required", "নিরাপত্তা যাচাইকরণ প্রয়োজন")}
          </h3>

          <p className="text-[12px] text-[#A0ADB0] mb-4">
            {t("Please confirm the following details to proceed with your withdrawal request.", "আপনার উত্তোলনের অনুরোধের সাথে এগিয়ে যেতে নিচের বিবরণগুলি নিশ্চিত করুন।")}
          </p>

          <div className="checklist-container">
            {/* চেক ১ */}
            <div 
              className={`checklist-item ${check1 ? "checked" : ""}`}
              onClick={() => setCheck1(!check1)}
            >
              <div className="checklist-box">
                {check1 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="checklist-text">{t("Check Your Verification Method", "আপনার ভেরিফিকেশন মেথড চেক করুন")}</span>
            </div>

            {/* চেক ২ */}
            <div 
              className={`checklist-item ${check2 ? "checked" : ""}`}
              onClick={() => setCheck2(!check2)}
            >
              <div className="checklist-box">
                {check2 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="checklist-text">{t("Check Your Profile Info", "আপনার প্রোফাইল তথ্য চেক করুন")}</span>
            </div>
          </div>
        </div>
      </main>

      <div className="submit-btn-wrapper">
        <button 
          onClick={handleVerify} 
          disabled={!check1 || !check2 || isVerifying}
          className="submit-btn"
        >
          {t("Verify Payment Method", "পেমেন্ট মেথড যাচাই করুন")}
        </button>
      </div>
    </div>
  );
}
