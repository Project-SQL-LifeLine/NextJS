"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminTipsPage() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchPendingTips();
  }, []);

  const fetchPendingTips = async () => {
    setLoading(true);
    try {
      // পেন্ডিং টিপ রিকোয়েস্টগুলো আনা (সেন্ডার এবং রিসিভারের গেম আইডিসহ)
      const { data, error } = await supabase
        .from("user_tip_send_history")
        .select(`
          *,
          sender:sender_id (game_id),
          receiver:receiver_id (game_id)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTips(data);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (tipId: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !confirm("Are you sure you want to reject this tip? The amount will be refunded to the sender.")) {
      return;
    }

    setProcessing(tipId);
    try {
      // ডাটাবেস ফাংশন (RPC) কল করা
      const { data, error } = await supabase.rpc("approve_tip_request", {
        p_tip_id: tipId,
        p_status: status,
        p_reason: status === "rejected" ? "Admin rejected" : null
      });

      if (error) throw error;

      if (data && data.success) {
        setMessage({ type: "success", text: data.message });
        fetchPendingTips(); // রিফ্রেশ লিস্ট
      } else {
        setMessage({ type: "error", text: data?.error || "Failed to process request." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading pending tips...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tip Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve user tip requests.</p>
        </div>
        <button 
          onClick={fetchPendingTips} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* টিপ টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Sender (From)</th>
                <th className="p-4 font-semibold">Receiver (To)</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No pending tip requests found.
                  </td>
                </tr>
              ) : (
                tips.map((tip) => (
                  <tr key={tip.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">
                      {new Date(tip.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {tip.sender?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {tip.receiver?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳{Number(tip.amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => handleAction(tip.id, "approved")} 
                        disabled={processing === tip.id}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        {processing === tip.id ? "..." : "Approve"}
                      </button>
                      <button 
                        onClick={() => handleAction(tip.id, "rejected")} 
                        disabled={processing === tip.id}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
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
