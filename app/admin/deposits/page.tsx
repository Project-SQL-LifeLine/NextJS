"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_deposit_transaction")
      .select(`
        *,
        profiles:user_id (game_id, mobile)
      `)
      .eq("transaction_type", "deposit")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) setDeposits(data);
    setLoading(false);
  };

  const handleApprove = async (txn: any) => {
    try {
      // ১. ট্রানজেকশন অ্যাপ্রুভ করা
      const { error: txnError } = await supabase
        .from("user_deposit_transaction")
        .update({ status: "approved" })
        .eq("id", txn.id);

      if (txnError) throw txnError;

      // ২. ইউজারের প্রোফাইল আনা
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance, bonus_balance, total_required_turnover, total_completed_turnover")
        .eq("id", txn.user_id)
        .single();

      if (profileError) throw profileError;

      const depositAmount = Number(txn.amount);
      const bonusAmount = Number(txn.claimed_bonus_amount) || 0; 
      
      // মেইন ব্যালেন্সে ডিপোজিট + বোনাস দুটোই যোগ হবে
      const newBalance = Number(profile.balance) + depositAmount + bonusAmount;
      // bonus_balance কলামে শুধু বোনাসের টাকা জমা হবে
      const newBonusBalance = Number(profile.bonus_balance || 0) + bonusAmount;
      
      // টার্নওভার লজিক
      const isPreviousTurnoverComplete = Number(profile.total_completed_turnover) >= Number(profile.total_required_turnover);
      let newReqTurnover = Number(profile.total_required_turnover);
      if (isPreviousTurnoverComplete) {
        newReqTurnover += Number(txn.required_turnover);
      }

      // ৩. ইউজারের প্রোফাইল আপডেট
      await supabase
        .from("profiles")
        .update({ 
          balance: newBalance,
          bonus_balance: newBonusBalance,
          total_required_turnover: newReqTurnover 
        })
        .eq("id", txn.user_id);

      // ==========================================
      // ৪. রেফারেল লজিক
      // ==========================================
      // referred_user_id দিয়ে রেকর্ড খোঁজা (স্ট্যাটাস যাই হোক)
      const { data: referralData } = await supabase
        .from("user_invited_friend_referral")
        .select("*")
        .eq("referred_user_id", txn.user_id)
        .maybeSingle();

      // যদি রেকর্ড পাওয়া যায় এবং আগে থেকে বোনাস যোগ করা না থাকে
      if (referralData && Number(referralData.bonus_amount) === 0) {
        
        // কমিশন সেটিংস আনা
        const { data: commissionSettings } = await supabase
          .from("referral_commission_control")
          .select("fixed_join_bonus, deposit_commission_percentage, min_deposit_required")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        // যদি সেটিংস থাকে এবং ডিপোজিট মিনিমাম লিমিট পার করে
        if (commissionSettings && depositAmount >= Number(commissionSettings.min_deposit_required)) {
          
          const fixedBonus = Number(commissionSettings.fixed_join_bonus) || 0;
          const depComm = (depositAmount * Number(commissionSettings.deposit_commission_percentage)) / 100;
          const totalCommission = fixedBonus + depComm;
          
          // ৪.১. রেফারেল টেবিল আপডেট (স্ট্যাটাস: approved, বোনাস: totalCommission)
          await supabase
            .from("user_invited_friend_referral")
            .update({ 
              status: 'approved', 
              deposit_amount: depositAmount,
              bonus_amount: totalCommission
            })
            .eq("id", referralData.id);

          // ৪.২. রেফারারের প্রোফাইলে referral_earnings যোগ করা
          const { data: referrerProfile, error: referrerError } = await supabase
            .from("profiles")
            .select("referral_earnings")
            .eq("id", referralData.referrer_id)
            .single();

          if (!referrerError && referrerProfile) {
            const newReferralEarnings = Number(referrerProfile.referral_earnings || 0) + totalCommission;
            
            await supabase
              .from("profiles")
              .update({ referral_earnings: newReferralEarnings })
              .eq("id", referralData.referrer_id);
          }
        }
      }
      // ==========================================

      alert("Deposit Approved Successfully! Balance, Turnover, and Referral Updated.");
      fetchDeposits();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this deposit?")) return;
    const { error } = await supabase.from("user_deposit_transaction").update({ status: "rejected" }).eq("id", id);
    if (!error) {
      alert("Deposit Rejected.");
      fetchDeposits();
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading deposits...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Deposit Requests</h1>
        <button onClick={fetchDeposits} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Refresh</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">TrxID</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Bonus</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No pending deposits found.</td></tr>
              ) : (
                deposits.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">{new Date(txn.created_at).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-gray-900">{txn.profiles?.game_id || "N/A"}</td>
                    <td className="p-4 uppercase">{txn.method_code}</td>
                    <td className="p-4 font-mono">{txn.transaction_reference}</td>
                    <td className="p-4 font-bold text-green-600">৳{txn.amount}</td>
                    <td className="p-4 text-orange-500">{txn.claimed_bonus_amount > 0 ? `৳${txn.claimed_bonus_amount}` : "-"}</td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button onClick={() => handleApprove(txn)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleReject(txn.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
