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
  const [proceeding, setProceeding] = useState(false);

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
    <div className="terms-page">
      <div className="terms-card">
        <h1 className="terms-title">
          {t("Withdrawal Terms & Conditions", "উত্তোলনের শর্তাবলী")}
        </h1>
        
        <div className="terms-scroll-box">
          <h3>1. GENERAL PROVISIONS AND ELIGIBILITY</h3>
          <p>By accessing, registering, or participating in any lottery services, games, or draws offered by the Lottery Authority, you unconditionally agree to abide by these Terms and Conditions. You must be at least 18 years of age or the legal age of majority in your jurisdiction to participate. The Lottery Authority strictly prohibits participation by minors. If it is discovered that a user is underage, their account will be immediately suspended, and all associated tickets, balances, and winnings will be forfeited without compensation. Furthermore, it is the sole responsibility of the user to ensure that participating in lottery activities is legal in their local jurisdiction. The Lottery Authority assumes no liability for any legal repercussions faced by users who violate local, state, or national laws regarding online gambling and lottery participation.</p>
          
          <h3>2. ACCOUNT REGISTRATION AND SECURITY</h3>
          <p>Users must provide accurate, current, and complete information during the registration process. The creation of multiple accounts by a single individual is strictly forbidden. The Lottery Authority reserves the right to merge, suspend, or terminate accounts suspected of being operated by the same individual for exploitative purposes. Users are solely responsible for maintaining the confidentiality of their login credentials, including passwords. Any unauthorized access to an account due to the user's negligence in safeguarding their credentials is entirely the responsibility of the user. The Lottery Authority will not be held liable for any financial loss resulting from compromised accounts. You agree to notify the Lottery Authority immediately of any unauthorized use of your account.</p>

          <h3>3. TICKET PURCHASES AND PRICING STRUCTURE</h3>
          <p>Lottery tickets can be purchased exclusively using the funds available in the user's Lottery Wallet. The Lottery Authority offers tickets in five distinct tiers: 50, 100, 250, 500, and 1000 BDT. When purchasing a ticket, the user must select a unique 12-digit number. Once a ticket is purchased and the unique number is confirmed, the transaction is final. Tickets cannot be cancelled, refunded, or modified after the purchase is completed. If a user enters an incorrect 12-digit number, the Lottery Authority bears no responsibility, and the ticket will be processed as entered. Ticket purchases are non-transferable. In the event of a system error affecting the pricing or processing of tickets, the Lottery Authority reserves the right to void the affected transactions and refund the wallet balance.</p>

          <h3>4. DRAW MECHANICS AND SCHEDULING</h3>
          <p>The draws will be conducted daily at a designated time (typically 12:30 AM). The Lottery Authority reserves the absolute right to change the draw schedule, postpone draws, or suspend draws entirely due to technical difficulties, force majeure, or operational requirements. Winners are selected randomly from the pool of valid, approved tickets for the specific draw. The random selection process is final and binding. The Lottery Authority does not guarantee that a draw will occur if there are insufficient tickets sold. In the event of a draw being cancelled, participants will be notified, and the jackpot may roll over to the next draw or the ticket cost refunded, at the sole discretion of the Lottery Authority.</p>

          <h3>5. WINNER SELECTION AND JACKPOT DISTRIBUTION</h3>
          <p>The selection of winners is conducted through a secure, randomized system or via a manual process overseen by the Lottery Authority. All decisions regarding winners are final. There is no right to appeal or contest the outcome of a draw. Upon the selection of a winner, the jackpot amount will be credited directly to the user's Lottery Wallet. The user acknowledges that the Lottery Authority is not responsible for delays in crediting funds due to network congestion or third-party payment gateway issues. Users are required to provide valid identification and banking information to claim major prizes. The Lottery Authority reserves the right to conduct internal audits before releasing significant winnings.</p>

          <h3>6. FEES, CHARGES, AND TAXES</h3>
          <p>To facilitate bank withdrawals, users are required to pay a one-time activation fee. This fee is separate from the Lottery Wallet balance and must be paid through the designated payment channels provided by the Lottery Authority. Additionally, users may be subject to other fees, including Management Fees, Service Fees, Network Fees, VAT, and GST, calculated based on the withdrawal amount. The user acknowledges that all fees are non-refundable unless otherwise stated. The Lottery Authority reserves the right to adjust the fee structure at any time. The user is solely responsible for any local taxes or duties applicable to their winnings in their jurisdiction.</p>

          <h3>7. WITHDRAWAL POLICIES AND RESTRICTIONS</h3>
          <p>Withdrawals from the Lottery Wallet are strictly subject to a minimum threshold of 50,000 BDT. The Lottery Authority processes withdrawals exclusively via Bank Transfer. Mobile financial services (such as Bkash or Nagad) are not supported for lottery winnings. Users must ensure that the bank details provided are accurate. The Lottery Authority will not be held liable for funds transferred to incorrect bank accounts provided by the user. Withdrawal requests are subject to internal review and approval. This process typically takes 24 to 72 working hours, excluding weekends and public holidays. The Lottery Authority reserves the right to request proof of identity and address for anti-money laundering (AML) compliance.</p>

          <h3>8. USER CONDUCT AND PROHIBITED ACTIVITIES</h3>
          <p>Users agree not to engage in any fraudulent, abusive, or illegal activities while using the lottery services. Any attempt to manipulate the draw, exploit system vulnerabilities, or use automated bots to purchase tickets will result in immediate account termination and forfeiture of all funds. The Lottery Authority strictly prohibits the use of VPNs, proxies, or any other methods to bypass geographic restrictions. Users agree to cooperate fully with any investigation conducted by the Lottery Authority or its affiliates regarding suspicious activities.</p>

          <h3>9. LIMITATION OF LIABILITY</h3>
          <p>The Lottery Authority provides its services on an "as is" and "as available" basis. The Lottery Authority makes no warranties, express or implied, regarding the availability, reliability, or accuracy of the services. The Lottery Authority shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the services. This includes, but is not limited to, damages for loss of profits, goodwill, data, or other intangible losses resulting from the use or inability to use the services. The user acknowledges that the Lottery Authority shall not be responsible for any errors, omissions, interruptions, deletions, defects, viruses, delays in operation or transmission, or any failure of performance, whether or not resulting from acts of God, communications failure, theft, destruction, or unauthorized access to the Lottery Authority's records.</p>

          <h3>10. ACCOUNT SUSPENSION AND TERMINATION</h3>
          <p>The Lottery Authority reserves the right to suspend or permanently terminate any user's account at its sole discretion, without prior notice. This action may be taken if the user violates these Terms and Conditions, engages in illegal activities, or if the Lottery Authority determines that the user's conduct is detrimental to the community or the operator. Upon termination, the user's right to access the services ceases immediately. Any outstanding balance may be forfeited if the termination is due to a violation of terms.</p>

          <h3>11. MODIFICATION OF TERMS</h3>
          <p>The Lottery Authority reserves the right to update or modify these Terms and Conditions at any time without prior notice. Any changes will be effective immediately upon posting on the website. It is the user's responsibility to review these terms periodically. Continued use of the services after modifications indicates the user's acceptance of the updated terms.</p>

          <h3>12. DISPUTE RESOLUTION AND GOVERNING LAW</h3>
          <p>Any disputes arising out of or relating to these Terms and Conditions shall be resolved exclusively by the Lottery Authority's internal resolution team. If a resolution cannot be reached, the dispute shall be settled in accordance with the governing laws of the jurisdiction where the Lottery Authority is registered. Users agree to waive any right to participate in a class action lawsuit against the Lottery Authority. The user acknowledges that they have read, understood, and agree to be bound by these Terms and Conditions.</p>
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
  );
}
