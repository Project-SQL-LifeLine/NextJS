"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!isChecked) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ডাটাবেসে টার্মস অ্যাক্সেপ্ট true করে দেওয়া
        await supabase
          .from("profiles")
          .update({ lottery_is_terms_accepted: true })
          .eq("id", user.id);
        
        // এরপর সিকিউর ভেরিফিকেশন পেজে পাঠানো
        router.push("/Lottery/Secure-cashout-activity");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

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
          disabled={!isChecked || loading}
          className="terms-btn"
        >
          {loading ? t("Processing...", "প্রসেসিং...") : t("Proceed to Verification", "ভেরিফিকেশনে এগিয়ে যান")}
        </button>
      </div>
    </div>
  );
}
