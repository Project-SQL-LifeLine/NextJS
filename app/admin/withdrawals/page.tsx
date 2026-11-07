"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_deposit_transaction")
      .select(`
        *,
        profiles:user_id (game_id, mobile)
      `)
      .eq("transaction_type", "withdrawal")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) setWithdrawals(data);
    setLoading(false);
  };

  const handleApprove = async (txn: any) => {
    if (!confirm("Are you sure you want to approve this withdrawal? (Make sure you have paid the user)")) return;

    const { error } = await supabase
      .from("user_deposit_transaction")
      .update({ status: "approved" })
      .eq("id", txn.id);

    if (!error) {
      alert("Withdrawal Approved!");
      fetchWithdrawals();
    }
  };

  const handleReject = async (txn: any) => {
    if (!confirm("Are you sure you want to reject this withdrawal? The amount will be refunded to the user.")) return;

    try {
      // ১. স্ট্যাটাস রিজেক্ট করা
      const { error: txnError } = await supabase
        .from("user_deposit_transaction")
        .update({ status: "rejected" })
        .eq("id", txn.id);

      if (txnError) throw txnError;

      // ২. ইউজারের ব্যালেন্স ফেরত দেওয়া
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", txn.user_id)
        .single();

      if (profile) {
        const newBalance = Number(profile.balance) + Number(txn.amount);
        await supabase.from("profiles").update({ balance: newBalance }).eq("id", txn.user_id);
      }

      alert("Withdrawal Rejected and Balance Refunded.");
      fetchWithdrawals();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading withdrawals...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <button onClick={fetchWithdrawals} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Refresh</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Account No</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No pending withdrawals found.</td></tr>
              ) : (
                withdrawals.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">{new Date(txn.created_at).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-gray-900">{txn.profiles?.game_id || "N/A"}</td>
                    <td className="p-4 uppercase">{txn.method_code}</td>
                    <td className="p-4 font-mono">{txn.transaction_reference}</td>
                    <td className="p-4 font-bold text-red-500">৳{txn.amount}</td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button onClick={() => handleApprove(txn)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleReject(txn)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Reject</button>
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
