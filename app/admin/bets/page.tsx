"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminBetsHistoryPage() {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    setLoading(true);
    try {
      // সর্বশেষ ১০০টি বাজির ডাটা আনা হচ্ছে (পারফরম্যান্সের জন্য)
      const { data, error } = await supabase
        .from("original_bets_history")
        .select(`
          *,
          profiles:user_id (game_id)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setBets(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // সার্চ ফিল্টার (গেম আইডি দিয়ে)
  const filteredBets = bets.filter((bet) => 
    bet.profiles?.game_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Bets History...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bets History</h1>
          <p className="text-gray-500 text-sm mt-1">Recent bets placed by all users.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Game ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={fetchBets} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Game ID</th>
                <th className="p-4 font-semibold">Game</th>
                <th className="p-4 font-semibold">Bet Amount</th>
                <th className="p-4 font-semibold">Result</th>
                <th className="p-4 font-semibold">Profit</th>
                <th className="p-4 font-semibold">Payout</th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No bets found.</td>
                </tr>
              ) : (
                filteredBets.map((bet) => (
                  <tr key={bet.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      {new Date(bet.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {bet.profiles?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 text-gray-700 capitalize">
                      {bet.game_name}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      ৳{Number(bet.bet_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        bet.is_win 
                          ? "bg-green-100 text-green-700 border border-green-200" 
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}>
                        {bet.is_win ? "WIN" : "LOSS"}
                      </span>
                    </td>
                    <td className={`p-4 font-bold ${bet.profit > 0 ? "text-green-600" : "text-red-500"}`}>
                      {bet.profit > 0 ? "+" : ""}৳{Number(bet.profit).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700">
                      ৳{Number(bet.payout || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 text-center">
        * Showing the most recent 100 bets.
      </p>

    </div>
  );
}
