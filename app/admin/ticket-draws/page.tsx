"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminTicketDrawsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [drawHistory, setDrawHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // প্রতিটি টিয়ারের জন্য আলাদা জ্যাকপট ইনপুট স্টেট
  const [prizeInputs, setPrizeInputs] = useState<{ [key: number]: string }>({
    50: "5000",
    100: "10000",
    250: "25000",
    500: "50000",
    1000: "100000",
  });

  const [isDrawing, setIsDrawing] = useState<number | null>(null);

  const ticketTiers = [50, 100, 250, 500, 1000];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. চলমান (Approved) টিকিটগুলো আনা
      const { data: txData, error: txError } = await supabase
        .from("ticket_transactions")
        .select("ticket_tier, id")
        .eq("status", "approved")
        .eq("transaction_type", "ticket_purchase");

      if (txError) throw txError;
      if (txData) setTransactions(txData);

      // ২. পুরনো ড্র এর হিস্ট্রি আনা
      const { data: drawData, error: drawError } = await supabase
        .from("ticket_draws")
        .select(`
          *,
          profiles:winner_user_id (game_id)
        `)
        .order("created_at", { ascending: false });

      if (drawError) throw drawError;
      if (drawData) setDrawHistory(drawData);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeChange = (tier: number, value: string) => {
    setPrizeInputs({ ...prizeInputs, [tier]: value });
  };

  const handleDraw = async (tier: number) => {
    const prizeAmount = Number(prizeInputs[tier]);
    if (!prizeAmount || prizeAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid prize amount." });
      return;
    }

    if (!window.confirm(`Are you sure you want to draw a winner for ৳${tier} tickets with ৳${prizeAmount} jackpot?`)) return;

    setIsDrawing(tier);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("execute_lottery_draw_by_tier", {
        p_ticket_tier: tier,
        p_prize_amount: prizeAmount,
      });

      if (error) throw error;

      if (data.success) {
        setMessage({ type: "success", text: `Winner successfully selected for ৳${tier} tier!` });
        fetchData(); // রিফ্রেশ ডাটা
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsDrawing(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Data...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lottery Draws Management</h1>
          <p className="text-gray-500 text-sm mt-1">Select a specific ticket tier to pick a random winner.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* টিকিট টিয়ার অনুযায়ী কার্ড */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ticketTiers.map((tier) => {
          // এই নির্দিষ্ট টিয়ারের মোট কতগুলো টিকিট Approved আছে তা গণনা
          const ticketsSold = transactions.filter(t => t.ticket_tier === tier).length;

          return (
            <div key={tier} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 rounded-bl-lg font-bold text-xs">
                ৳ {tier} TICKET
              </div>
              
              <div className="mt-4 mb-4">
                <p className="text-sm text-gray-500 font-semibold mb-1">Active Tickets Sold:</p>
                <p className="text-2xl font-extrabold text-blue-600">{ticketsSold} Tickets</p>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Set Jackpot Amount (৳)</label>
                <input
                  type="number"
                  value={prizeInputs[tier]}
                  onChange={(e) => handlePrizeChange(tier, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => handleDraw(tier)}
                disabled={isDrawing !== null || ticketsSold === 0}
                className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${
                  ticketsSold === 0 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isDrawing === tier ? (
                  "Drawing..."
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Draw Winner for ৳{tier}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* পুরনো ড্র এর টেবিল (Past Draws) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Past Winners History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Winner (Game ID)</th>
                <th className="p-4 font-semibold">Ticket Tier</th>
                <th className="p-4 font-semibold">Prize Amount</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {drawHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No draws executed yet.</td>
                </tr>
              ) : (
                drawHistory.map((draw) => (
                  <tr key={draw.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-700 font-bold">
                      {new Date(draw.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {draw.profiles?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 text-gray-700">
                      ৳ {draw.winning_ticket_price}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳ {Number(draw.prize_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        COMPLETED
                      </span>
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
