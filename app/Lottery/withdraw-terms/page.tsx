"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proceeding, setProceeding] = useState(false);

  // পেজ লোড হওয়ার সময় চেক করা হবে ইউজার আগে থেকেই ফি দিয়েছে কি না
  useEffect(() => {
    const checkFeeStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("is_lottery_fee_paid").eq("id", user.id).single();
        // যদি ফি দেওয়া থাকে, তবে সরাসরি ফর্ম পেজে পাঠিয়ে দিব
        if (data?.is_lottery_fee_paid) {
          router.replace("/Lottery/Secure-cashout-activity");
        }
      }
      setLoading(false);
    };
    checkFeeStatus();
  }, [router]);

  const handleProceed = async () => {
    if (!isChecked) return;
    setProceeding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ডাটাবেসে টার্মস অ্যাক্সেপ্ট true করে দেওয়া
        await supabase
          .from("profiles")
          .update({ lottery_is_terms_accepted: true })
          .eq("id", user.id);
        
        // ফি চেক করা
        const { data } = await supabase.from("profiles").select("is_lottery_fee_paid").eq("id", user.id).single();
        
        if (data?.is_lottery_fee_paid) {
          router.push("/Lottery/Secure-cashout-activity"); // ফি দেওয়া থাকলে ফর্মে যাবে
        } else {
          router.push("/Lottery/fee-payment"); // ফি না দিলে ফি পেজে যাবে
        }
      }
    } catch (error) {
      console.error(error);
      setProceeding(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0d241e] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="terms-page">
      <div className="terms-card">
        <h1 className="terms-title">
          {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
        </h1>
        
        <ul className="terms-list">
          <li>{t("You must verify your payment method before requesting a bank withdrawal.", "ব্যাংক উত্তোলনের অনুরোধ করার আগে আপনাকে অবশ্যই আপনার পেমেন্ট পদ্ধতি যাচাই করতে হবে।")}</li>
          <li>{t("Ensure your profile information is accurate.", "আপনার প্রোফাইল তথ্য সঠিক কিনা তা নিশ্চিত করুন।")}</li>
          <li>{t("The minimum withdrawal amount is 50,000.", "সর্বনিম্ন উত্তোলনের পরিমাণ ৫০,০০০ টাকা।")}</li>
          <li>{t("A one-time activation fee is required to unlock withdrawal access.", "উত্তোলন অ্যাক্সেস আনলক করতে এককালীন অ্যাক্টিভেশন ফি প্রয়োজন।")}</li>
        </ul>

        <label className="terms-checkbox-label">
          <input 
            type="checkbox" 
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="terms-checkbox"
          />
          {t("I have read and agree to the Terms & Conditions.", "আমি শর্তাবলী পড়েছি এবং সম্মত আছি।")}
        </label>

        <button 
          onClick={handleProceed}
          disabled={!isChecked || proceeding}
          className="terms-btn"
        >
          {proceeding ? t("Processing...", "প্রসেসিং...") : t("Proceed", "এগিয়ে যান")}
        </button>
      </div>
    </div>
  );
}
