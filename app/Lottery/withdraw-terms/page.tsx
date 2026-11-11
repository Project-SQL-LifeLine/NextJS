"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer";
import "./withdraw-terms.css";

export default function WithdrawTermsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  // ইউজার প্রোফাইল লোড করা (হেডারে দেখানোর জন্য)
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchUser();
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

  return (
    <div className="terms-page-wrapper">
      {/* কমন লটারি হেডার */}
      <LotteryHeader userProfile={profile} />

      <div className="terms-page pb-20">
        <div className="terms-card">
          <h1 className="terms-title">
            {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
          </h1>
          
          <div className="terms-scroll-box">
            <h3>{t("1. GENERAL PROVISIONS AND ELIGIBILITY", "১. সাধারণ বিধান এবং যোগ্যতা")}</h3>
            <p>{t("By accessing, registering, or participating in any lottery services, games, or draws offered by the Lottery Authority, you unconditionally agree to abide by these Terms and Conditions. You must be at least 18 years of age or the legal age of majority in your jurisdiction to participate. The Lottery Authority strictly prohibits participation by minors. If it is discovered that a user is underage, their account will be immediately suspended, and all associated tickets, balances, and winnings will be forfeited without compensation. Furthermore, it is the sole responsibility of the user to ensure that participating in lottery activities is legal in their local jurisdiction. The Lottery Authority assumes no liability for any legal repercussions faced by users who violate local, state, or national laws regarding online gambling and lottery participation.", "লটারি কর্তৃপক্ষের দ্বারা প্রদত্ত যেকোনো লটারি পরিষেবা, গেম বা ড্র-এ প্রবেশ, নিবন্ধন বা অংশগ্রহণ করে, আপনি এই শর্তাবলী মেনে চলতে বিনা শর্তে সম্মত হচ্ছেন। অংশগ্রহণের জন্য আপনার বয়স কমপক্ষে ১৮ বছর বা আপনার এখতিয়ারে আইনি সংখ্যাগরিষ্ঠ বয়স হতে হবে। লটারি কর্তৃপক্ষ নাবালকদের অংশগ্রহণ কঠোরভাবে নিষিদ্ধ করে। যদি এটি আবিষ্কৃত হয় যে একজন ব্যবহারকারী নাবালক, তবে তাদের অ্যাকাউন্ট অবিলম্বে স্থগিত করা হবে এবং সমস্ত সংশ্লিষ্ট টিকিট, ব্যালেন্স এবং জয়ের পরিমাণ ক্ষতিপূরণ ছাড়াই বাজেয়াপ্ত করা হবে। তদুপরি, লটারি কার্যক্রমে অংশগ্রহণ তাদের স্থানীয় এখতিয়ারে বৈধ কিনা তা নিশ্চিত করা ব্যবহারকারীর একমাত্র দায়িত্ব। অনলাইন জুয়া এবং লটারি অংশগ্রহণ সংক্রান্ত স্থানীয়, রাজ্য বা জাতীয় আইন লঙ্ঘনকারী ব্যবহারকারীদের যে কোনো আইনি পরিণতির জন্য লটারি কর্তৃপক্ষ কোনো দায়বদ্ধতা গ্রহণ করে না।")}</p>
            
            <h3>{t("2. ACCOUNT REGISTRATION AND SECURITY", "২. অ্যাকাউন্ট নিবন্ধন এবং নিরাপত্তা")}</h3>
            <p>{t("Users must provide accurate, current, and complete information during the registration process. The creation of multiple accounts by a single individual is strictly forbidden. The Lottery Authority reserves the right to merge, suspend, or terminate accounts suspected of being operated by the same individual for exploitative purposes. Users are solely responsible for maintaining the confidentiality of their login credentials, including passwords. Any unauthorized access to an account due to the user's negligence in safeguarding their credentials is entirely the responsibility of the user. The Lottery Authority will not be held liable for any financial loss resulting from compromised accounts. You agree to notify the Lottery Authority immediately of any unauthorized use of your account.", "ব্যবহারকারীদের অবশ্যই নিবন্ধন প্রক্রিয়া চলাকালীন সঠিক, বর্তমান এবং সম্পূর্ণ তথ্য প্রদান করতে হবে। একজন ব্যক্তির দ্বারা একাধিক অ্যাকাউন্ট তৈরি করা কঠোরভাবে নিষিদ্ধ। শোষণমূলক উদ্দেশ্যে একই ব্যক্তির দ্বারা পরিচালিত সন্দেহভাজন অ্যাকাউন্টগুলো একীভূত, স্থগিত বা বন্ধ করার অধিকার লটারি কর্তৃপক্ষ সংরক্ষণ করে। পাসওয়ার্ড সহ তাদের লগইন শংসাপত্রের গোপনীয়তা বজায় রাখা ব্যবহারকারীদের একমাত্র দায়িত্ব। ব্যবহারকারীর অবহেলার কারণে অ্যাকাউন্টে কোনো অননুমোদিত অ্যাক্সেস সম্পূর্ণভাবে ব্যবহারকারীর দায়িত্ব। আপস করা অ্যাকাউন্ট থেকে কোনো আর্থিক ক্ষতির জন্য লটারি কর্তৃপক্ষ দায়ী থাকবে না। আপনার অ্যাকাউন্টের যেকোনো অননুমোদিত ব্যবহারের বিষয়ে আপনি অবিলম্বে লটারি কর্তৃপক্ষকে অবহিত করতে সম্মত হন।")}</p>

            <h3>{t("3. TICKET PURCHASES AND PRICING STRUCTURE", "৩. টিকিট ক্রয় এবং মূল্য কাঠামো")}</h3>
            <p>{t("Lottery tickets can be purchased exclusively using the funds available in the user's Lottery Wallet. The Lottery Authority offers tickets in five distinct tiers: 50, 100, 250, 500, and 1000 BDT. When purchasing a ticket, the user must select a unique 12-digit number. Once a ticket is purchased and the unique number is confirmed, the transaction is final. Tickets cannot be cancelled, refunded, or modified after the purchase is completed. If a user enters an incorrect 12-digit number, the Lottery Authority bears no responsibility, and the ticket will be processed as entered. Ticket purchases are non-transferable. In the event of a system error affecting the pricing or processing of tickets, the Lottery Authority reserves the right to void the affected transactions and refund the wallet balance.", "লটারি টিকিট শুধুমাত্র ব্যবহারকারীর লটারি ওয়ালেটে উপলব্ধ তহবিল ব্যবহার করে কেনা যাবে। লটারি কর্তৃপক্ষ পাঁচটি স্বতন্ত্র স্তরে টিকিট সরবরাহ করে: ৫০, ১০০, ২৫০, ৫০০ এবং ১০০০ টাকা। টিকিট কেনার সময়, ব্যবহারকারীকে একটি অনন্য ১২-সংখ্যার নম্বর নির্বাচন করতে হবে। একবার টিকিট কেনা হয়ে গেলে এবং অনন্য নম্বর নিশ্চিত হয়ে গেলে, লেনদেন চূড়ান্ত। কেনা সম্পন্ন হওয়ার পরে টিকিট বাতিল, ফেরত বা পরিবর্তন করা যাবে না। যদি ব্যবহারকারী ভুল ১২-সংখ্যার নম্বর প্রবেশ করেন, তবে লটারি কর্তৃপক্ষ কোনো দায়বদ্ধতা বহন করে না এবং টিকিটটি প্রবেশ করানো হিসাবে প্রক্রিয়া করা হবে। টিকিট ক্রয় হস্তান্তরযোগ্য নয়। টিকিটের মূল্য বা প্রক্রিয়াকরণকে প্রভাবিত করে এমন সিস্টেম ত্রুটির ক্ষেত্রে, লটারি কর্তৃপক্ষ ক্ষতিগ্রস্ত লেনদেন বাতিল এবং ওয়ালেট ব্যালেন্স ফেরত দেওয়ার অধিকার সংরক্ষণ করে।")}</p>
            
            <h3>{t("4. DRAW MECHANICS AND SCHEDULING", "৪. ড্র মেকানিক্স এবং সময়সূচী")}</h3>
            <p>{t("The draws will be conducted daily at a designated time (typically 12:30 AM). The Lottery Authority reserves the absolute right to change the draw schedule, postpone draws, or suspend draws entirely due to technical difficulties, force majeure, or operational requirements. Winners are selected randomly from the pool of valid, approved tickets for the specific draw. The random selection process is final and binding. The Lottery Authority does not guarantee that a draw will occur if there are insufficient tickets sold. In the event of a draw being cancelled, participants will be notified, and the jackpot may roll over to the next draw or the ticket cost refunded, at the sole discretion of the Lottery Authority.", "ড্র প্রতিদিন একটি নির্ধারিত সময়ে (সাধারণত রাত ১২:৩০ মিনিটে) অনুষ্ঠিত হবে। প্রযুক্তিগত অসুবিধা, অনিবার্য কারণ বা পরিচালনাগত প্রয়োজনের কারণে ড্রয়ের সময়সূচী পরিবর্তন, ড্র স্থগিত বা সম্পূর্ণভাবে স্থগিত করার সম্পূর্ণ অধিকার লটারি কর্তৃপক্ষ সংরক্ষণ করে। নির্দিষ্ট ড্রয়ের জন্য বৈধ, অনুমোদিত টিকিটের পুল থেকে বিজয়ীদের এলোমেলোভাবে নির্বাচন করা হয়। এলোমেলো নির্বাচন প্রক্রিয়া চূড়ান্ত এবং বাধ্যতামূলক। পর্যাপ্ত টিকিট বিক্রি না হলে ড্র হবে বলে লটারি কর্তৃপক্ষ গ্যারান্টি দেয় না। ড্র বাতিল হলে অংশগ্রহণকারীদের জানানো হবে এবং লটারি কর্তৃপক্ষের একক বিবেচনায় জ্যাকপট পরবর্তী ড্রয়ে স্থানান্তরিত হতে পারে বা টিকিটের মূল্য ফেরত দেওয়া হতে পারে।")}</p>

            <h3>{t("5. WINNER SELECTION AND JACKPOT DISTRIBUTION", "৫. বিজয়ী নির্বাচন এবং জ্যাকপট বিতরণ")}</h3>
            <p>{t("The selection of winners is conducted through a secure, randomized system or via a manual process overseen by the Lottery Authority. All decisions regarding winners are final. There is no right to appeal or contest the outcome of a draw. Upon the selection of a winner, the jackpot amount will be credited directly to the user's Lottery Wallet. The user acknowledges that the Lottery Authority is not responsible for delays in crediting funds due to network congestion or third-party payment gateway issues. Users are required to provide valid identification and banking information to claim major prizes. The Lottery Authority reserves the right to conduct internal audits before releasing significant winnings.", "বিজয়ীদের নির্বাচন একটি সুরক্ষিত, র্যান্ডমাইজড সিস্টেমের মাধ্যমে বা লটারি কর্তৃপক্ষের তত্ত্বাবধানে ম্যানুয়াল প্রক্রিয়ার মাধ্যমে পরিচালিত হয়। বিজয়ীদের সম্পর্কে সমস্ত সিদ্ধান্ত চূড়ান্ত। ড্রয়ের ফলাফল নিয়ে আপিল বা প্রতিদ্বন্দ্বিতা করার কোনো অধিকার নেই। বিজয়ী নির্বাচনের পর, জ্যাকপটের পরিমাণ সরাসরি ব্যবহারকারীর লটারি ওয়ালেটে জমা করা হবে। ব্যবহারকারী স্বীকার করেন যে নেটওয়ার্ক জ্যাম বা থার্ড-পার্টি পেমেন্ট গেটওয়ে সমস্যার কারণে তহবিল জমা করতে বিলম্বের জন্য লটারি কর্তৃপক্ষ দায়ী নয়। বড় পুরস্কার দাবি করতে ব্যবহারকারীদের বৈধ পরিচয় এবং ব্যাংকিং তথ্য প্রদান করতে হবে। উল্লেখযোগ্য জয় প্রকাশের আগে অভ্যন্তরীণ নিরীক্ষা পরিচালনা করার অধিকার লটারি কর্তৃপক্ষ সংরক্ষণ করে।")}</p>

            <h3>{t("6. FEES, CHARGES, AND TAXES", "৬. ফি, চার্জ এবং কর")}</h3>
            <p>{t("To facilitate bank withdrawals, users are required to pay a one-time activation fee. This fee is separate from the Lottery Wallet balance and must be paid through the designated payment channels provided by the Lottery Authority. Additionally, users may be subject to other fees, including Management Fees, Service Fees, Network Fees, VAT, and GST, calculated based on the withdrawal amount. The user acknowledges that all fees are non-refundable unless otherwise stated. The Lottery Authority reserves the right to adjust the fee structure at any time. The user is solely responsible for any local taxes or duties applicable to their winnings in their jurisdiction.", "ব্যাংক প্রত্যাহার সহজতর করার জন্য, ব্যবহারকারীদের এককালীন অ্যাক্টিভেশন ফি দিতে হবে। এই ফি লটারি ওয়ালেট ব্যালেন্স থেকে আলাদা এবং লটারি কর্তৃপক্ষের প্রদত্ত মনোনীত পেমেন্ট চ্যানেলের মাধ্যমে দিতে হবে। অতিরিক্তভাবে, প্রত্যাহারের পরিমাণের উপর ভিত্তি করে গণনা করা ম্যানেজমেন্ট ফি, পরিষেবা ফি, নেটওয়ার্ক ফি, ভ্যাট এবং জিএসটি সহ অন্যান্য ফি ব্যবহারকারীর উপর প্রযোজ্য হতে পারে। ব্যবহারকারী স্বীকার করেন যে সমস্ত ফি অফেরতযোগ্য যদি না অন্যথায় বলা হয়। লটারি কর্তৃপক্ষ যেকোনো সময় ফি কাঠামো সামঞ্জস্য করার অধিকার সংরক্ষণ করে। তাদের এখতিয়ারে তাদের জয়ের জন্য প্রযোজ্য কোনো স্থানীয় কর বা শুল্কের জন্য ব্যবহারকারী এককভাবে দায়ী।")}</p>

            <h3>{t("7. WITHDRAWAL POLICIES AND RESTRICTIONS", "৭. প্রত্যাহার নীতি এবং বিধিনিষেধ")}</h3>
            <p>{t("Withdrawals from the Lottery Wallet are strictly subject to a minimum threshold of 50,000 BDT. The Lottery Authority processes withdrawals exclusively via Bank Transfer. Mobile financial services (such as Bkash or Nagad) are not supported for lottery winnings. Users must ensure that the bank details provided are accurate. The Lottery Authority will not be held liable for funds transferred to incorrect bank accounts provided by the user. Withdrawal requests are subject to internal review and approval. This process typically takes 24 to 72 working hours, excluding weekends and public holidays. The Lottery Authority reserves the right to request proof of identity and address for anti-money laundering (AML) compliance.", "লটারি ওয়ালেট থেকে প্রত্যাহার কঠোরভাবে ন্যূনতম ৫০,০০০ টাকা সীমার অধীন। লটারি কর্তৃপক্ষ একচেটিয়াভাবে ব্যাংক ট্রান্সফারের মাধ্যমে প্রত্যাহার প্রক্রিয়া করে। মোবাইল আর্থিক পরিষেবা (যেমন বিকাশ বা নগদ) লটারি জয়ের জন্য সমর্থিত নয়। ব্যবহারকারীদের অবশ্যই নিশ্চিত করতে হবে যে প্রদত্ত ব্যাংক বিবরণ সঠিক। ব্যবহারকারীর প্রদত্ত ভুল ব্যাংক অ্যাকাউন্টে স্থানান্তরিত তহবিলের জন্য লটারি কর্তৃপক্ষ দায়ী থাকবে না। প্রত্যাহারের অনুরোধ অভ্যন্তরীণ পর্যালোচনা এবং অনুমোদনের সাপেক্ষে। এই প্রক্রিয়াটি সাধারণত সাপ্তাহিক ছুটি এবং সরকারি ছুটি বাদ দিয়ে ২৪ থেকে ৭২ কর্মঘণ্টা সময় নেয়। মানি লন্ডারিং বিরোধী (এএমএল) সম্মতির জন্য পরিচয় এবং ঠিকানার প্রমাণ অনুরোধ করার অধিকার লটারি কর্তৃপক্ষ সংরক্ষণ করে।")}</p>

            <h3>{t("8. USER CONDUCT AND PROHIBITED ACTIVITIES", "৮. ব্যবহারকারীর আচরণ এবং নিষিদ্ধ কার্যক্রম")}</h3>
            <p>{t("Users agree not to engage in any fraudulent, abusive, or illegal activities while using the lottery services. Any attempt to manipulate the draw, exploit system vulnerabilities, or use automated bots to purchase tickets will result in immediate account termination and forfeiture of all funds. The Lottery Authority strictly prohibits the use of VPNs, proxies, or any other methods to bypass geographic restrictions. Users agree to cooperate fully with any investigation conducted by the Lottery Authority or its affiliates regarding suspicious activities.", "ব্যবহারকারীরা লটারি পরিষেবা ব্যবহার করার সময় কোনো প্রতারণামূলক, অপমানজনক বা অবৈধ কার্যকলাপে জড়িত না হওয়ার জন্য সম্মত হন। ড্র পরিচালনার যেকোনো প্রচেষ্টা, সিস্টেমের দুর্বলতা কাজে লাগানো বা টিকিট কেনার জন্য স্বয়ংক্রিয় বট ব্যবহার করা হলে অ্যাকাউন্ট অবিলম্বে বন্ধ এবং সমস্ত তহবিল বাজেয়াপ্ত করা হবে। ভৌগলিক নিষেধাজ্ঞা বাইপাস করতে ভিপিএন, প্রক্সি বা অন্য কোনো পদ্ধতি ব্যবহার লটারি কর্তৃপক্ষ কঠোরভাবে নিষিদ্ধ করে। সন্দেহজনক কার্যকলাপের বিষয়ে লটারি কর্তৃপক্ষ বা এর সহযোগীদের দ্বারা পরিচালিত যেকোনো তদন্তে সম্পূর্ণ সহযোগিতা করতে ব্যবহারকারীরা সম্মত হন।")}</p>

            <h3>{t("9. LIMITATION OF LIABILITY", "৯. দায়বদ্ধতার সীমাবদ্ধতা")}</h3>
            <p>{t("The Lottery Authority provides its services on an 'as is' and 'as available' basis. The Lottery Authority makes no warranties, express or implied, regarding the availability, reliability, or accuracy of the services. The Lottery Authority shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the services. This includes, but is not limited to, damages for loss of profits, goodwill, data, or other intangible losses resulting from the use or inability to use the services. The user acknowledges that the Lottery Authority shall not be responsible for any errors, omissions, interruptions, deletions, defects, viruses, delays in operation or transmission, or any failure of performance, whether or not resulting from acts of God, communications failure, theft, destruction, or unauthorized access to the Lottery Authority's records.", "লটারি কর্তৃপক্ষ তার পরিষেবাগুলি 'যেমন আছে' এবং 'যেমন উপলব্ধ' ভিত্তিতে সরবরাহ করে। পরিষেবার প্রাপ্যতা, নির্ভরযোগ্যতা বা নির্ভুলতা সম্পর্কে লটারি কর্তৃপক্ষ কোনো ওয়ারেন্টি দেয় না। পরিষেবার ব্যবহার থেকে উদ্ভূত বা এর সাথে সম্পর্কিত কোনো পরোক্ষ, আনুষঙ্গিক, বিশেষ বা ফলস্বরূপ ক্ষতির জন্য লটারি কর্তৃপক্ষ দায়ী থাকবে না। এর মধ্যে রয়েছে, তবে সীমাবদ্ধ নয়, মুনাফা, সুনাম, ডেটা বা অন্যান্য অদৃশ্য ক্ষতির ক্ষতি। ব্যবহারকারী স্বীকার করেন যে কোনো ত্রুটি, বাদ, বাধা, মুছে ফেলা, ত্রুটি, ভাইরাস, অপারেশন বা ট্রান্সমিশনে বিলম্ব বা কর্মক্ষমতার কোনো ব্যর্থতার জন্য লটারি কর্তৃপক্ষ দায়ী থাকবে না।")}</p>

            <h3>{t("10. ACCOUNT SUSPENSION AND TERMINATION", "১০. অ্যাকাউন্ট স্থগিত এবং সমাপ্তি")}</h3>
            <p>{t("The Lottery Authority reserves the right to suspend or permanently terminate any user's account at its sole discretion, without prior notice. This action may be taken if the user violates these Terms and Conditions, engages in illegal activities, or if the Lottery Authority determines that the user's conduct is detrimental to the community or the operator. Upon termination, the user's right to access the services ceases immediately. Any outstanding balance may be forfeited if the termination is due to a violation of terms.", "পূর্ব নোটিশ ছাড়াই লটারি কর্তৃপক্ষ তার একক বিবেচনার ভিত্তিতে যেকোনো ব্যবহারকারীর অ্যাকাউন্ট স্থগিত বা স্থায়ীভাবে বন্ধ করার অধিকার সংরক্ষণ করে। ব্যবহারকারী এই শর্তাবলী লঙ্ঘন করলে, অবৈধ কার্যকলাপে জড়িত থাকলে বা লটারি কর্তৃপক্ষ নির্ধারণ করলে যে ব্যবহারকারীর আচরণ সম্প্রদায় বা অপারেটরের জন্য ক্ষতিকর, তবে এই পদক্ষেপ নেওয়া হতে পারে। সমাপ্তির পর, পরিষেবাগুলি অ্যাক্সেস করার ব্যবহারকারীর অধিকার অবিলম্বে বন্ধ হয়ে যায়। শর্তাবলী লঙ্ঘনের কারণে সমাপ্তি হলে কোনো বকেয়া ব্যালেন্স বাজেয়াপ্ত করা হতে পারে।")}</p>

            <h3>{t("11. MODIFICATION OF TERMS", "১১. শর্তাবলী পরিবর্তন")}</h3>
            <p>{t("The Lottery Authority reserves the right to update or modify these Terms and Conditions at any time without prior notice. Any changes will be effective immediately upon posting on the website. It is the user's responsibility to review these terms periodically. Continued use of the services after modifications indicates the user's acceptance of the updated terms.", "পূর্ব নোটিশ ছাড়াই লটারি কর্তৃপক্ষ যেকোনো সময় এই শর্তাবলী আপডেট বা পরিবর্তন করার অধিকার সংরক্ষণ করে। কোনো পরিবর্তন ওয়েবসাইটে পোস্ট করার সাথে সাথেই কার্যকর হবে। পর্যায়ক্রমে এই শর্তাবলী পর্যালোচনা করা ব্যবহারকারীর দায়িত্ব। পরিবর্তনের পরে পরিষেবাগুলির অব্যাহত ব্যবহার ব্যবহারকারীর আপডেট হওয়া শর্তাবলীর স্বীকৃতি নির্দেশ করে।")}</p>

            <h3>{t("12. DISPUTE RESOLUTION AND GOVERNING LAW", "১২. বিরোধ নিষ্পত্তি এবং পরিচালনা আইন")}</h3>
            <p>{t("Any disputes arising out of or relating to these Terms and Conditions shall be resolved exclusively by the Lottery Authority's internal resolution team. If a resolution cannot be reached, the dispute shall be settled in accordance with the governing laws of the jurisdiction where the Lottery Authority is registered. Users agree to waive any right to participate in a class action lawsuit against the Lottery Authority. The user acknowledges that they have read, understood, and agree to be bound by these Terms and Conditions.", "এই শর্তাবলী থেকে উদ্ভূত বা এর সাথে সম্পর্কিত যেকোনো বিরোধ একচেটিয়াভাবে লটারি কর্তৃপক্ষের অভ্যন্তরীণ রেজোলিউশন দল দ্বারা সমাধান করা হবে। যদি কোনো সমাধানে পৌঁছানো না যায়, তবে বিরোধটি লটারি কর্তৃপক্ষ নিবন্ধিত এখতিয়ারের পরিচালনা আইন অনুসারে নিষ্পত্তি করা হবে। ব্যবহারকারীরা লটারি কর্তৃপক্ষের বিরুদ্ধে ক্লাস অ্যাকশন মামলায় অংশগ্রহণের যেকোনো অধিকার ত্যাগ করতে সম্মত হন। ব্যবহারকারী স্বীকার করেন যে তারা এই শর্তাবলী পড়েছেন, বুঝেছেন এবং এর দ্বারা আবদ্ধ হতে সম্মত হয়েছেন।")}</p>
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

      {/* কমন লটারি ফুটার */}
      <LotteryFooter />
    </div>
  );
}
