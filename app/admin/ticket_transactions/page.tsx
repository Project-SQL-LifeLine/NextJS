"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ১. useRouter ইমপোর্ট করা হলো
import { supabase } from "../../../lib/supabase/client";

export default function AdminTicketTransactionsPage() {
  const router = useRouter(); // ২. রাউটার ডিক্লেয়ার
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [activeType, setActiveType] = useState<string>("all");
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    setTransactions([]); // ৩. নতুন ডাটা আনার আগে পুরনো ডাটা UI থেকে মুছে ফেলা হচ্ছে

    try {
      const { data, error } = await supabase
        .from("ticket_transactions")
        .select(`
          *,
          profiles ( game_id )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setTransactions(data);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tx: any) => {
    if (!window.confirm("Are you sure you want to approve this transaction?")) return;
    
    setProcessingId(tx.id);
    try {
      let response;
      if (tx.transaction_type === "fee_payment") {
        response = await supabase.rpc("approve_lottery_fee", { p_tx_id: tx.id });
      } else {
        response = await supabase.rpc("approve_lottery_transaction", { p_tx_id: tx.id });
      }

      if (response.error) throw response.error;
      
      if (response.data?.success) {
        setMessage({ type: "success", text: "Transaction approved successfully!" });
        
        // ৪. ডাটা রিফ্রেশ করা এবং Next.js ক্যাশ ক্লিয়ার করা
        await fetchTransactions(); 
        router.refresh(); 
        
      } else {
        setMessage({ type: "error", text: response.data?.error || "Approval failed." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessingId(null); 
    }
  };

  const handleReject = async (tx: any) => {
    if (!window.confirm("Are you sure you want to reject this transaction?")) return;
    
    setProcessingId(tx.id);
    try {
      if (tx.transaction_type === "withdrawal") {
        const response = await supabase.rpc("reject_lottery_withdrawal", { p_tx_id: tx.id });
        if (response.error) throw response.error;
      } else {
        const { error } = await supabase
          .from("ticket_transactions")
          .update({ status: "rejected" })
          .eq("id", tx.id);
        if (error) throw error;
      }
      setMessage({ type: "success", text: "Transaction rejected." });
      
      await fetchTransactions();
      router.refresh(); // রিজেক্ট করার পরেও ক্যাশ ক্লিয়ার হবে
      
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const gameId = tx.profiles?.game_id || "Unknown";
    const trxId = tx.trx_id || "";
    const trackId = tx.ticket_dp_track_id || "";
    const currentStatus = tx.status?.toLowerCase() || "unknown";
    const currentType = tx.transaction_type?.toLowerCase() || "unknown";

    const matchesSearch = 
      gameId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trackId.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = false;
    if (activeTab === "all") matchesStatus = true;
    else if (activeTab === "pending") matchesStatus = (currentStatus === "pending" || currentStatus === "drawn");
    else matchesStatus = (currentStatus === activeTab);

    const matchesType = activeType === "all" || currentType === activeType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "balance_reload": return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Balance Reload</span>;
      case "fee_payment": return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Fee Payment</span>;
      case "withdrawal": return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">Withdrawal</span>;
      case "ticket_purchase":
      default: return <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">Ticket Purchase</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto p-4">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and approve user transactions.</p>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "pending" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          Pending ({transactions.filter(t => t.status === 'pending' || t.status === 'drawn').length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "approved" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          History (Approved)
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "rejected" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          Rejected
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "all" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          All Status
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "ticket_purchase", "balance_reload", "withdrawal", "fee_payment"].map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeType === type 
                ? "bg-gray-800 text-white border-gray-800" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {type === "all" ? "All Types" : 
             type === "ticket_purchase" ? "Tickets" : 
             type === "balance_reload" ? "Reloads" : 
             type === "withdrawal" ? "Withdrawals" : "Fees"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 w-full max-w-md">
        <input
          type="text"
          placeholder="Search Game ID, TrxID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-blue-500"
        />
        <button 
          onClick={fetchTransactions} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
        >
          Refresh
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">User (Game ID)</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">TrxID / TrackID</th>
                <th className="p-4 font-semibold">Status</th>
                {activeTab === "pending" && <th className="p-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 7 : 6} className="p-8 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 7 : 6} className="p-8 text-center text-gray-500">
                    No transactions found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : "N/A"}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {tx.profiles?.game_id || "Unknown"}
                    </td>
                    <td className="p-4">
                      {getTypeBadge(tx.transaction_type)}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳{Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">
                      {tx.trx_id ? `Trx: ${tx.trx_id}` : ""} <br/>
                      {tx.ticket_dp_track_id ? `Trk: ${tx.ticket_dp_track_id}` : ""}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                        tx.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                        tx.status === "drawn" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                        "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}>
                        {tx.status ? tx.status.toUpperCase() : "UNKNOWN"}
                      </span>
                    </td>
                    
                    {activeTab === "pending" && (
                      <td className="p-4 text-right flex justify-end gap-2">
                        {(tx.status === "pending" || tx.status === "drawn") && (
                          <>
                            <button 
                              onClick={() => handleApprove(tx)}
                              disabled={processingId === tx.id}
                              className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {processingId === tx.id ? "Wait..." : "Approve"}
                            </button>
                            <button 
                              onClick={() => handleReject(tx)}
                              disabled={processingId === tx.id}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-bold transition-colors text-xs disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    )}
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
