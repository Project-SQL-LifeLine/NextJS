"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
// BottomNav সরিয়ে LotteryFooter যুক্ত করা হলো
import LotteryFooter from "../Footer/Footer"; 
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
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

  // লোডিং স্ক্রিন
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">
          LOADING TERMS...
        </p>
      </div>
    );
  }

  return (
    <div className="terms-page-wrapper">
      <LotteryHeader userProfile={profile} />

      <div className="terms-page">
        <div className="terms-card">
          <h1 className="terms-title">
            {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
          </h1>
          
          {/* স্ক্রলেবল টার্মস বক্স */}
          <div className="terms-scroll-box">
            <h3>{t("1. GENERAL PROVISIONS AND ELIGIBILITY", "১. সাধারণ বিধান এবং যোগ্যতা")}</h3>
            <p>{t("By accessing, registering, or participating in any lottery services provided by the Lottery Authority, you agree to be bound by these Terms and Conditions. Participants must be at least 18 years of age and legally capable of entering into binding contracts.", "লটারি কর্তৃপক্ষের দ্বারা প্রদত্ত যেকোনো লটারি পরিষেবা অ্যাক্সেস, নিবন্ধন বা অংশগ্রহণ করার মাধ্যমে, আপনি এই শর্তাবলী মেনে চলতে সম্মত হচ্ছেন। অংশগ্রহণকারীদের বয়স কমপক্ষে ১৮ বছর হতে হবে এবং আইনত চুক্তি করার উপযুক্ত হতে হবে।")}</p>
            
            <h3>{t("2. ACCOUNT REGISTRATION AND SECURITY", "২. অ্যাকাউন্ট নিবন্ধন এবং নিরাপত্তা")}</h3>
            <p>{t("Users must provide accurate, current, and complete information during the registration process. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.", "ব্যবহারকারীদের অবশ্যই নিবন্ধন প্রক্রিয়া চলাকালীন সঠিক, বর্তমান এবং সম্পূর্ণ তথ্য প্রদান করতে হবে। আপনার অ্যাকাউন্টের তথ্যের গোপনীয়তা বজায় রাখা এবং আপনার অ্যাকাউন্টের অধীনে ঘটে যাওয়া সমস্ত কার্যক্রমের জন্য আপনি একাই দায়ী।")}</p>
            
            <h3>{t("3. TICKET PURCHASES AND PRICING STRUCTURE", "৩. টিকিট ক্রয় এবং মূল্য কাঠামো")}</h3>
            <p>{t("Lottery tickets can be purchased exclusively using the Lottery Wallet balance. All purchases are final and non-refundable. Ticket numbers are generated randomly or selected manually, and each ticket is valid only for the specific draw it was purchased for.", "লটারি টিকিট শুধুমাত্র লটারি ওয়ালেট ব্যালেন্স ব্যবহার করে কেনা যাবে। সমস্ত ক্রয় চূড়ান্ত এবং অফেরতযোগ্য। টিকিট নম্বরগুলি এলোমেলোভাবে তৈরি বা ম্যানুয়ালি নির্বাচন করা হয় এবং প্রতিটি টিকিট শুধুমাত্র যে ড্রয়ের জন্য কেনা হয়েছিল তার জন্যই বৈধ।")}</p>
            
            <h3>{t("4. DRAW MECHANICS AND SCHEDULING", "৪. ড্র মেকানিক্স এবং সময়সূচী")}</h3>
            <p>{t("The draws will be conducted daily at a designated time (12:30 AM). The results will be published immediately after the draw on the Winners page. Late entries or tickets purchased after the cut-off time will be automatically entered into the next day's draw.", "ড্র প্রতিদিন একটি নির্ধারিত সময়ে (রাত ১২:৩০) অনুষ্ঠিত হবে। ড্র শেষ হওয়ার সাথে সাথে ফলাফল বিজয়ীদের পৃষ্ঠায় প্রকাশ করা হবে। কাট-অফ সময়ের পরে কেনা টিকিটগুলি স্বয়ংক্রিয়ভাবে পরের দিনের ড্রতে প্রবেশ করবে।")}</p>
            
            <h3>{t("5. WINNER SELECTION AND JACKPOT DISTRIBUTION", "৫. বিজয়ী নির্বাচন এবং জ্যাকপট বিতরণ")}</h3>
            <p>{t("The selection of winners is conducted through a secure and verified random number generator. The prize amount will be automatically credited to the winner's Lottery Wallet balance. The authority's decision regarding winners is final and binding.", "বিজয়ীদের নির্বাচন একটি সুরক্ষিত এবং যাচাইকৃত র‍্যান্ডম নম্বর জেনারেটরের মাধ্যমে করা হয়। পুরস্কারের পরিমাণ স্বয়ংক্রিয়ভাবে বিজয়ীর লটারি ওয়ালেট ব্যালেন্সে যোগ করা হবে। বিজয়ীদের সম্পর্কে কর্তৃপক্ষের সিদ্ধান্তই চূড়ান্ত এবং বাধ্যতামূলক।")}</p>
            
            <h3>{t("6. FEES, CHARGES, AND TAXES", "৬. ফি, চার্জ এবং কর")}</h3>
            <p>{t("To facilitate bank withdrawals, users are required to pay specific activation fees (including VAT, GST, Management, and Network fees). These fees are mandatory to process the withdrawal and verify the user's account.", "ব্যাংক প্রত্যাহার সহজতর করার জন্য, ব্যবহারকারীদের নির্দিষ্ট অ্যাক্টিভেশন ফি (ভ্যাট, জিএসটি, ম্যানেজমেন্ট এবং নেটওয়ার্ক ফিসহ) দিতে হবে। প্রত্যাহার প্রক্রিয়া এবং ব্যবহারকারীর অ্যাকাউন্ট যাচাই করার জন্য এই ফিগুলি বাধ্যতামূলক।")}</p>
            
            <h3>{t("7. WITHDRAWAL POLICIES AND RESTRICTIONS", "৭. প্রত্যাহার নীতি এবং বিধিনিষেধ")}</h3>
            <p>{t("Withdrawals from the Lottery Wallet are strictly subject to the minimum withdrawal limit (e.g., 50,000 BDT). The authority may require additional verification (such as KYC documents) before processing large withdrawals. Withdrawals are processed within 24-48 hours.", "লটারি ওয়ালেট থেকে প্রত্যাহার কঠোরভাবে সর্বনিম্ন প্রত্যাহার সীমা (যেমন: ৫০,০০০ টাকা) সাপেক্ষে। বড় পরিমাণ প্রত্যাহার প্রক্রিয়া করার আগে কর্তৃপক্ষ অতিরিক্ত যাচাইকরণ (যেমন: KYC ডকুমেন্ট) প্রয়োজন হতে পারে। প্রত্যাহার ২৪-৪৮ ঘণ্টার মধ্যে প্রক্রিয়া করা হয়।")}</p>
            
            <h3>{t("8. USER CONDUCT AND PROHIBITED ACTIVITIES", "৮. ব্যবহারকারীর আচরণ এবং নিষিদ্ধ কার্যক্রম")}</h3>
            <p>{t("Users agree not to engage in any fraudulent, abusive, or illegal activities, including but not limited to using multiple accounts, exploiting bugs, or manipulating the draw system. Violations will result in immediate account suspension.", "ব্যবহারকারীরা একাধিক অ্যাকাউন্ট ব্যবহার, বাগ শোষণ বা ড্র সিস্টেম ম্যানিপুলেশনসহ যেকোনো প্রতারণামূলক, অপব্যবহারমূলক বা অবৈধ কার্যকলাপে জড়িত না থাকতে সম্মত হন। লঙ্ঘনের ফলে অবিলম্বে অ্যাকাউন্ট স্থগিত করা হবে।")}</p>
            
            <h3>{t("9. LIMITATION OF LIABILITY", "৯. দায়বদ্ধতার সীমাবদ্ধতা")}</h3>
            <p>{t("The Lottery Authority provides its services on an 'as is' and 'as available' basis. We are not liable for any network failures, server downtime, or technical glitches that may affect ticket purchases or draw results.", "লটারি কর্তৃপক্ষ তার পরিষেবাগুলি 'যেমন আছে' এবং 'যেমন উপলব্ধ' ভিত্তিতে সরবরাহ করে। কোনো নেটওয়ার্ক ব্যর্থতা, সার্ভার ডাউনটাইম বা টেকনিক্যাল ত্রুটির জন্য আমরা দায়ী নই যা টিকিট ক্রয় বা ড্র ফলাফলকে প্রভাবিত করতে পারে।")}</p>
            
            <h3>{t("10. ACCOUNT SUSPENSION AND TERMINATION", "১০. অ্যাকাউন্ট স্থগিত এবং সমাপ্তি")}</h3>
            <p>{t("The Lottery Authority reserves the right to suspend or terminate any account suspected of fraud, money laundering, or violating these terms. Funds in suspended accounts may be withheld pending investigation.", "লটারি কর্তৃপক্ষ প্রতারণা, মানি লন্ডারিং বা এই শর্তাবলী লঙ্ঘনের সন্দেহে যেকোনো অ্যাকাউন্ট স্থগিত বা বন্ধ করার অধিকার সংরক্ষণ করে। তদন্তের সময় স্থগিত অ্যাকাউন্টের তহবিল আটকে রাখা হতে পারে।")}</p>
            
            <h3>{t("11. MODIFICATION OF TERMS", "১১. শর্তাবলী পরিবর্তন")}</h3>
            <p>{t("The Lottery Authority reserves the right to update or modify these Terms and Conditions at any time without prior notice. It is the user's responsibility to review the terms periodically for any changes.", "লটারি কর্তৃপক্ষ পূর্ব নোটিশ ছাড়াই যেকোনো সময় এই শর্তাবলী আপডেট বা পরিবর্তন করার অধিকার সংরক্ষণ করে। যেকোনো পরিবর্তনের জন্য পর্যায়ক্রমে শর্তাবলী পর্যালোচনা করা ব্যবহারকারীর দায়িত্ব।")}</p>
            
            <h3>{t("12. DISPUTE RESOLUTION AND GOVERNING LAW", "১২. বিরোধ নিষ্পত্তি এবং পরিচালনা আইন")}</h3>
            <p>{t("Any disputes arising out of or relating to these Terms or the services provided shall be resolved through binding arbitration in accordance with the local laws of the jurisdiction where the Lottery Authority operates.", "এই শর্তাবলী বা প্রদত্ত পরিষেবাগুলির সাথে সম্পর্কিত যেকোনো বিরোধ নিষ্পত্তি স্থানীয় আইন অনুসারে বাধ্যতামূলক সালিশের মাধ্যমে সমাধান করা হবে।")}</p>
          </div>

          {/* চেকবক্স এবং বাটন (এগুলো স্ক্রল হবে না, ফিক্সড থাকবে) */}
          <div className="terms-action-box">
            <label className="terms-checkbox-label">
              <input 
                type="checkbox" 
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="terms-checkbox"
              />
              <span>{t("I have read, understood, and agree to the Terms & Conditions.", "আমি শর্তাবলী পড়েছি, বুঝেছি এবং সম্মত আছি।")}</span>
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
      </div>

      <LotteryFooter />
    </div>
  );
}
