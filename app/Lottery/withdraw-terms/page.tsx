"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer"; // BottomNav সরিয়ে Footer যুক্ত করা হলো
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [proceeding, setProceeding] = useState(false);

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
    
    // ২.৯ সেকেন্ডের লোডিং টাইমার
    const timer = new Promise((resolve) => setTimeout(resolve, 2900));
    Promise.all([fetchData(), timer]).then(() => {
      setLoading(false);
    });
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
    // h-[100dvh] এবং overflow-hidden ব্যবহার করে পেজ স্ক্রল বন্ধ করা হয়েছে
    <div className="terms-page-wrapper h-[100dvh] flex flex-col overflow-hidden bg-[#0d241e]">
      <LotteryHeader userProfile={profile} />

      {/* flex-1 ব্যবহার করে মেইন কন্টেন্টকে স্ক্রিনের বাকি অংশ দখল করতে দেওয়া হয়েছে */}
      <div className="terms-page flex-1 flex flex-col px-4 py-3 overflow-hidden">
        <div className="terms-card flex flex-col h-full max-h-[85vh]">
          <h1 className="terms-title shrink-0">
            {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
          </h1>
          
          {/* এই বক্সটিই শুধু স্ক্রল হবে */}
          <div className="terms-scroll-box flex-1 overflow-y-auto min-h-0 mb-4">
            
            <h3>{t("1. General Provisions", "১. সাধারণ বিধানাবলী")}</h3>
            <p>{t("By accessing, registering, or participating in any lottery services provided by us, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must immediately cease using our services.", "আমাদের প্রদত্ত যেকোনো লটারি পরিষেবা ব্যবহার, নিবন্ধন বা অংশগ্রহণের মাধ্যমে আপনি এই শর্তাবলী মেনে নিতে সম্মত হচ্ছেন। আপনি যদি এই শর্তাবলীর কোনো অংশে সম্মত না হন, তবে অবশ্যই আমাদের পরিষেবা ব্যবহার বন্ধ করতে হবে।")}</p>
            
            <h3>{t("2. Eligibility and Account Security", "২. যোগ্যতা এবং অ্যাকাউন্ট নিরাপত্তা")}</h3>
            <p>{t("Users must be at least 18 years of age. You are solely responsible for maintaining the confidentiality of your account credentials. Any activity performed through your account will be deemed as your responsibility.", "ব্যবহারকারীর বয়স অবশ্যই কমপক্ষে ১৮ বছর হতে হবে। আপনার অ্যাকাউন্টের পাসওয়ার্ড এবং তথ্যের গোপনীয়তা রক্ষার দায়িত্ব শুধুমাত্র আপনার। আপনার অ্যাকাউন্টের মাধ্যমে করা যেকোনো কার্যক্রম আপনার নিজের দায়িত্ব বলে গণ্য হবে।")}</p>
            
            <h3>{t("3. Minimum Withdrawal Limit", "৩. সর্বনিম্ন উইথড্র সীমা")}</h3>
            <p>{t("The minimum withdrawal amount is 50,000 BDT. Withdrawal requests below this limit will not be processed by the system.", "সর্বনিম্ন উত্তোলনের পরিমাণ ৫০,০০০ টাকা। এই সীমার নিচে কোনো উত্তোলনের অনুরোধ সিস্টেম দ্বারা প্রসেস করা হবে না।")}</p>

            <h3>{t("4. Verification Fees and Taxes", "৪. ভেরিফিকেশন ফি এবং কর")}</h3>
            <p>{t("To process withdrawals, users must clear all applicable management fees, service fees, network fees, VAT, and GST. Withdrawals will remain locked until these fees are fully paid and verified by the authority.", "উত্তোলন প্রক্রিয়া করতে, ব্যবহারকারীকে অবশ্যই সমস্ত প্রযোজ্য ম্যানেজমেন্ট ফি, সার্ভিস ফি, নেটওয়ার্ক ফি, ভ্যাট এবং জিএসটি পরিশোধ করতে হবে। এই ফিগুলো সম্পূর্ণরূপে পরিশোধ এবং কর্তৃপক্ষ দ্বারা যাচাই না হওয়া পর্যন্ত উত্তোলন লক থাকবে।")}</p>

            <h3>{t("5. KYC and Anti-Money Laundering (AML)", "৫. কেওয়াইসি এবং মানি লন্ডারিং প্রতিরোধ")}</h3>
            <p>{t("We strictly follow AML policies. We reserve the right to request identity verification (NID/Passport) before processing any withdrawal. Failure to provide valid documents will result in account suspension.", "আমরা কঠোরভাবে মানি লন্ডারিং প্রতিরোধ নীতি অনুসরণ করি। যেকোনো উত্তোলন প্রসেস করার আগে আমরা পরিচয় যাচাইকরণ (NID/পাসপোর্ট) চাওয়ার অধিকার রাখি। বৈধ নথি প্রদান করতে ব্যর্থ হলে অ্যাকাউন্ট স্থগিত করা হবে।")}</p>

            <h3>{t("6. Processing Time", "৬. প্রসেসিং সময়")}</h3>
            <p>{t("Once the fee is paid and verified, withdrawal requests are typically processed within 1 to 2 business days. However, during high traffic or technical maintenance, it may take longer.", "ফি পরিশোধ এবং যাচাই হওয়ার পর, উত্তোলনের অনুরোধ সাধারণত ১ থেকে ২ কার্যদিবসের মধ্যে প্রসেস করা হয়। তবে অতিরিক্ত চাপ বা কারিগরি রক্ষণাবেক্ষণের সময় এটি আরও বেশি সময় নিতে পারে।")}</p>

            <h3>{t("7. Prohibited Activities", "৭. নিষিদ্ধ কার্যক্রম")}</h3>
            <p>{t("Users agree not to engage in any fraudulent activities, hacking, using multiple accounts to manipulate the system, or submitting fake transaction IDs. Violation will lead to permanent account termination and forfeiture of funds.", "ব্যবহারকারীরা কোনো ধরনের প্রতারণা, হ্যাকিং, সিস্টেম ম্যানিপুলেট করতে একাধিক অ্যাকাউন্ট ব্যবহার বা ভুয়া ট্রানজেকশন আইডি জমা দেওয়ার সাথে জড়িত থাকতে সম্মত নন। এই নিয়ম ভঙ্গ করলে অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করা হবে এবং সমস্ত অর্থ বাজেয়াপ্ত করা হবে।")}</p>

            <h3>{t("8. Limitation of Liability", "৮. দায়বদ্ধতার সীমাবদ্ধতা")}</h3>
            <p>{t("The Lottery Authority is not liable for any network issues, bank delays, or technical glitches that may cause delays in withdrawal processing. Our maximum liability is limited to the amount of the pending withdrawal.", "লটারি কর্তৃপক্ষ কোনো নেটওয়ার্ক সমস্যা, ব্যাংক বিলম্ব বা কারিগরি ত্রুটির জন্য দায়ী নয়, যা উত্তোলন প্রক্রিয়ায় বিলম্ব ঘটাতে পারে। আমাদের সর্বোচ্চ দায়বদ্ধতা পেন্ডিং উত্তোলনের পরিমাণের মধ্যে সীমাবদ্ধ।")}</p>

            <h3>{t("9. Modification of Terms", "৯. শর্তাবলী পরিবর্তন")}</h3>
            <p>{t("We reserve the right to update, modify, or change these terms at any time without prior notice. It is the user's responsibility to review the terms periodically.", "আমরা পূর্ব নোটিশ ছাড়াই যেকোনো সময় এই শর্তাবলী আপডেট, পরিবর্তন বা পরিবর্তন করার অধিকার রাখি। শর্তাবলী পর্যায়ক্রমে পর্যালোচনা করা ব্যবহারকারীর দায়িত্ব।")}</p>
          </div>

          {/* চেকবক্স এবং বাটন স্ক্রল হবে না */}
          <div className="shrink-0">
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
              className="terms-btn flex justify-center items-center gap-2"
            >
              {proceeding ? (
                <>
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("Processing...", "প্রসেসিং...")}
                </>
              ) : (
                t("Proceed to Verification", "ভেরিফিকেশনে এগিয়ে যান")
              )}
            </button>
          </div>
        </div>
      </div>

      <LotteryFooter />
    </div>
  );
}
