"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import BottomNav from "../../../components/BottomNav"; // BottomNav যুক্ত করা হলো
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true); // নতুন লোডিং স্টেট
  const [isChecked, setIsChecked] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  // পেজ লোড হওয়ার সময় ব্যাকগ্রাউন্ডে ইউজার ডাটা লোড করা
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (data) setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false); // ডাটা লোড শেষ হলে লোডার বন্ধ হবে
      }
    };
    fetchData();
  }, []);

  const handleProceed = async () => {
    if (!isChecked) return;
    setProceeding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ lottery_is_terms_accepted: true })
          .eq("id", user.id);
        
        const { data } = await supabase.from("profiles").select("is_lottery_fee_paid").eq("id", user.id).single();
        
        if (data?.is_lottery_fee_paid) {
          router.push("/Lottery/Secure-cashout-activity");
        } else {
          router.push("/Lottery/fee-payment");
        }
      }
    } catch (error) {
      console.error(error);
      setProceeding(false);
    }
  };

  // ==========================================
  // লোডিং স্ক্রিন (যখন ডাটা লোড হবে)
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        {/* Terms/ডকুমেন্ট SVG আইকন */}
        <svg 
          className="w-12 h-12 text-white animate-spin" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <div className="terms-page-wrapper">
      <LotteryHeader userProfile={profile} />

      <div className="terms-page pb-20">
        <div className="terms-card">
          <h1 className="terms-title">
            {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
          </h1>
          
          <div className="terms-scroll-box">
            {/* এখানে আপনার আগের সব টার্মস লেখা থাকবে (আমি ১২টি সেকশনই রেখেছি) */}
            <h3>{t("1. GENERAL PROVISIONS AND ELIGIBILITY", "১. সাধারণ বিধান এবং যোগ্যতা")}</h3>
            <p>{t("By accessing, registering, or participating in any lottery services...", "লটারি কর্তৃপক্ষের দ্বারা প্রদত্ত যেকোনো লটারি পরিষেবা...")}</p>
            <h3>{t("2. ACCOUNT REGISTRATION AND SECURITY", "২. অ্যাকাউন্ট নিবন্ধন এবং নিরাপত্তা")}</h3>
            <p>{t("Users must provide accurate, current, and complete information...", "ব্যবহারকারীদের অবশ্যই নিবন্ধন প্রক্রিয়া চলাকালীন সঠিক...")}</p>
            <h3>{t("3. TICKET PURCHASES AND PRICING STRUCTURE", "৩. টিকিট ক্রয় এবং মূল্য কাঠামো")}</h3>
            <p>{t("Lottery tickets can be purchased exclusively using...", "লটারি টিকিট শুধুমাত্র ব্যবহারকারীর লটারি ওয়ালেটে...")}</p>
            <h3>{t("4. DRAW MECHANICS AND SCHEDULING", "৪. ড্র মেকানিক্স এবং সময়সূচী")}</h3>
            <p>{t("The draws will be conducted daily at a designated time...", "ড্র প্রতিদিন একটি নির্ধারিত সময়ে...")}</p>
            <h3>{t("5. WINNER SELECTION AND JACKPOT DISTRIBUTION", "৫. বিজয়ী নির্বাচন এবং জ্যাকপট বিতরণ")}</h3>
            <p>{t("The selection of winners is conducted through a secure...", "বিজয়ীদের নির্বাচন একটি সুরক্ষিত...")}</p>
            <h3>{t("6. FEES, CHARGES, AND TAXES", "৬. ফি, চার্জ এবং কর")}</h3>
            <p>{t("To facilitate bank withdrawals, users are required...", "ব্যাংক প্রত্যাহার সহজতর করার জন্য...")}</p>
            <h3>{t("7. WITHDRAWAL POLICIES AND RESTRICTIONS", "৭. প্রত্যাহার নীতি এবং বিধিনিষেধ")}</h3>
            <p>{t("Withdrawals from the Lottery Wallet are strictly subject to...", "লটারি ওয়ালেট থেকে প্রত্যাহার কঠোরভাবে...")}</p>
            <h3>{t("8. USER CONDUCT AND PROHIBITED ACTIVITIES", "৮. ব্যবহারকারীর আচরণ এবং নিষিদ্ধ কার্যক্রম")}</h3>
            <p>{t("Users agree not to engage in any fraudulent...", "ব্যবহারকারীরা লটারি পরিষেবা ব্যবহার করার সময়...")}</p>
            <h3>{t("9. LIMITATION OF LIABILITY", "৯. দায়বদ্ধতার সীমাবদ্ধতা")}</h3>
            <p>{t("The Lottery Authority provides its services on an...", "লটারি কর্তৃপক্ষ তার পরিষেবাগুলি...")}</p>
            <h3>{t("10. ACCOUNT SUSPENSION AND TERMINATION", "১০. অ্যাকাউন্ট স্থগিত এবং সমাপ্তি")}</h3>
            <p>{t("The Lottery Authority reserves the right to suspend...", "পূর্ব নোটিশ ছাড়াই লটারি কর্তৃপক্ষ...")}</p>
            <h3>{t("11. MODIFICATION OF TERMS", "১১. শর্তাবলী পরিবর্তন")}</h3>
            <p>{t("The Lottery Authority reserves the right to update...", "পূর্ব নোটিশ ছাড়াই লটারি কর্তৃপক্ষ যেকোনো সময়...")}</p>
            <h3>{t("12. DISPUTE RESOLUTION AND GOVERNING LAW", "১২. বিরোধ নিষ্পত্তি এবং পরিচালনা আইন")}</h3>
            <p>{t("Any disputes arising out of or relating to these Terms...", "এই শর্তাবলী থেকে উদ্ভূত বা এর সাথে সম্পর্কিত যেকোনো...")}</p>
          </div>

          <label className="terms-checkbox-label">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="terms-checkbox"
            />
            {t("I have read, understood, and agree to the Terms & Conditions.", "আমি শর্তাবলী পড়েছি, বুঝেছি এবং সম্মত আছি।")}
          </label>

          <button 
            onClick={handleProceed}
            disabled={!isChecked || proceeding}
            className="terms-btn"
          >
            {proceeding ? t("Processing...", "প্রসেসিং...") : t("Proceed to Verification", "ভেরিফিকেশনে এগিয়ে যান")}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
