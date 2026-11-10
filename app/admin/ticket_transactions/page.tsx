"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminTicketTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ticket_transactions")
        .select(`
          *,
          profiles:user_id (game_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // অ্যাপ্রুভ করার ফাংশন
  const handleApprove = async (tx: any) => {
    if (!window.confirm("Are you sure you want to approve this transaction?")) return;
    
    try {
      let response;
      
      // ট্রানজেকশন টাইপ অনুযায়ী আলাদা ফাংশন কল হবে
      if (tx.transaction_type === "fee_payment") {
        // ফি পেমেন্টের জন্য approve_lottery_fee ফাংশন
        response = await supabase.rpc("approve_lottery_fee", { p_tx_id: tx.id });
      } else {
        // অন্য সব (balance_reload) জন্য approve_lottery_transaction ফাংশন
        response = await supabase.rpc("approve_lottery_transaction", { p_tx_id: tx.id });
      }

      if (response.error) throw response.error;
      
      if (response.data.success) {
        setMessage({ type: "success", text: "Transaction approved successfully!" });
        fetchTransactions(); // রিফ্রেশ
      } else {
        setMessage({ type: "error", text: response.data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // রিজেক্ট করার ফাংশন
  const handleReject = async (tx: any) => {
    if (!window.confirm("Are you sure you want to reject this transaction?")) return;
    
    try {
      // যদি উইথড্র হয়, তবে reject_lottery_withdrawal কল করে টাকা ফেরত দিতে হবে
      if (tx.transaction_type === "withdrawal") {
        const response = await supabase.rpc("reject_lottery_withdrawal", { p_tx_id: tx.id });
        if (response.error) throw response.error;
      } else {
        // সাধারণ রিজেক্ট
        const { error } = await supabase
          .from("ticket_transactions")
          .update({ status: "rejected" })
          .eq("id", tx.id);
        if (error) throw error;
      }

      setMessage({ type: "success", text: "Transaction rejected." });
      fetchTransactions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // ফিল্টারিং ও সার্চ
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.profiles?.game_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.trx_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.ticket_dp_track_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // ট্রানজেকশন টাইপের নাম ও কালার নির্ধারণের হেল্পার ফাংশন
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "balance_reload":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Balance Reload</span>;
      case "fee_payment":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Fee Payment</span>;
      case "withdrawal":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">Withdrawal</span>;
      case "ticket_purchase":
      default:
        return <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">Ticket Purchase</span>;
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Transactions...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage reloads, fees, and ticket purchases.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Game ID, TrxID, TrackID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Status</option>
          </select>
          <button 
            onClick={fetchTransactions} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">User (Game ID)</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">TrxID / TrackID</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {tx.profiles?.game_id || "Unknown"}
                    </td>
                    <td className="p-4">
                      {getTypeBadge(tx.transaction_type)}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">
                      {tx.trx_id ? `Trx: ${tx.trx_id}` : ""} <br/>
                      {tx.ticket_dp_track_id ? `Trk: ${tx.ticket_dp_track_id}` : ""}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                        tx.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                        "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {tx.status === "pending" && (
                        <>
                          <button 
                            onClick={() => handleApprove(tx)}
                            className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(tx)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-bold transition-colors text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
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
