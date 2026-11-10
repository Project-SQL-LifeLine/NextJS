"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminTicketDrawsPage() {
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // মডাল স্টেট (নতুন ড্র তৈরির জন্য)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDrawDate, setNewDrawDate] = useState("");
  const [newJackpot, setNewJackpot] = useState("150000");

  // ড্র এক্সিকিউট হওয়ার স্টেট
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      // ড্র টেবিল এবং বিজয়ীর গেম আইডি জয়েন করা
      const { data, error } = await supabase
        .from("ticket_draws")
        .select(`
          *,
          profiles:winner_user_id (game_id)
        `)
        .order("draw_date", { ascending: false });

      if (error) throw error;
      if (data) setDraws(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load draws." });
    } finally {
      setLoading(false);
    }
  };

  // নতুন ড্র তৈরি করা
  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrawDate || !newJackpot) return;

    try {
      const { error } = await supabase.from("ticket_draws").insert({
        draw_date: newDrawDate,
        total_jackpot: Number(newJackpot),
        status: "upcoming",
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "New draw created successfully!" });
      setIsModalOpen(false);
      setNewDrawDate("");
      fetchDraws();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // ড্র এক্সিকিউট করা (Random Winner Select)
  const handleExecuteDraw = async (drawId: string) => {
    if (!window.confirm("Are you sure you want to execute this draw? A random winner will be selected and their balance will be updated.")) return;

    setIsDrawing(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.rpc("execute_lottery_draw", {
        p_draw_id: drawId,
      });

      if (error) throw error;

      if (data && data.success) {
        setMessage({ type: "success", text: "Draw executed successfully! Winner has been selected." });
        fetchDraws();
      } else {
        setMessage({ type: "error", text: data?.error || "Failed to execute draw." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsDrawing(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Draws...</div>;
  }

  // চলতি ড্র এবং পুরনো ড্র আলাদা করা
  const upcomingDraw = draws.find(d => d.status === "upcoming");
  const pastDraws = draws.filter(d => d.status === "completed");

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lottery Draws Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create new draws and pick winners manually or automatically.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            + Create New Draw
          </button>
          <button 
            onClick={fetchDraws} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
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

      {/* চলতি ড্র (Upcoming) */}
      {upcomingDraw ? (
        <div className="bg-white border-2 border-yellow-400 rounded-xl shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-black px-4 py-1 rounded-bl-lg font-bold text-xs">
            UPCOMING DRAW
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Draw Date: {upcomingDraw.draw_date ? new Date(upcomingDraw.draw_date).toLocaleDateString() : "N/A"}
          </h2>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-gray-500 font-semibold">Total Jackpot:</span>
            <span className="text-3xl font-extrabold text-green-600">
              ৳ {Number(upcomingDraw.total_jackpot || 0).toLocaleString()}
            </span>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleExecuteDraw(upcomingDraw.id)}
              disabled={isDrawing}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isDrawing ? "Drawing..." : "Execute Auto Draw (Pick Random Winner)"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Clicking this will randomly select an approved ticket and credit the jackpot to the user's lottery balance.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">No upcoming draw found. Please create a new draw.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            Create Draw Now
          </button>
        </div>
      )}

      {/* পুরনো ড্র এর টেবিল (Past Draws) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-4">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Past Winners History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Draw Date</th>
                <th className="p-4 font-semibold">Jackpot Amount</th>
                <th className="p-4 font-semibold">Winner (Game ID)</th>
                <th className="p-4 font-semibold">Winning Ticket Tier</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pastDraws.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No completed draws found.</td>
                </tr>
              ) : (
                pastDraws.map((draw) => (
                  <tr key={draw.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-700 font-bold">
                      {draw.draw_date ? new Date(draw.draw_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ৳ {Number(draw.prize_amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {draw.profiles?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 text-gray-700">
                      ৳ {draw.winning_ticket_price || 0} Tier
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

      {/* নতুন ড্র তৈরির মডাল */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Draw</h2>
            <form onSubmit={handleCreateDraw} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Draw Date</label>
                <input
                  type="date"
                  value={newDrawDate}
                  onChange={(e) => setNewDrawDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Total Jackpot Amount (৳)</label>
                <input
                  type="number"
                  value={newJackpot}
                  onChange={(e) => setNewJackpot(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold"
                >
                  Create Draw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
