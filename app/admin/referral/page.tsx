"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminReferralPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // সেটিংস ফর্ম স্টেট
  const [formData, setFormData] = useState({
    min_deposit_required: 300,
    fixed_join_bonus: 50,
    deposit_commission_percentage: 1,
    withdraw_commission_percentage: 1,
    wager_milestone_amount: 10000,
    wager_bonus_amount: 100,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. রেফারেল ডাটা আনা
      const { data: refData, error: refError } = await supabase
        .from("user_invited_friend_referral")
        .select(`
          *,
          referrer:referrer_id (game_id),
          referred:referred_user_id (game_id)
        `)
        .order("created_at", { ascending: false });

      if (refError) throw refError;
      if (refData) setReferrals(refData);

      // ২. রেফারেল সেটিংস আনা
      const { data: setData, error: setError } = await supabase
        .from("referral_commission_control")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!setError && setData) {
        setSettings(setData);
        setFormData({
          min_deposit_required: Number(setData.min_deposit_required) || 300,
          fixed_join_bonus: Number(setData.fixed_join_bonus) || 50,
          deposit_commission_percentage: Number(setData.deposit_commission_percentage) || 1,
          withdraw_commission_percentage: Number(setData.withdraw_commission_percentage) || 1,
          wager_milestone_amount: Number(setData.wager_milestone_amount) || 10000,
          wager_bonus_amount: Number(setData.wager_bonus_amount) || 100,
        });
      }

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: Number(value) });
  };

  // সেটিংস আপডেট করা
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSavingSettings(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase
        .from("referral_commission_control")
        .update({
          min_deposit_required: formData.min_deposit_required,
          fixed_join_bonus: formData.fixed_join_bonus,
          deposit_commission_percentage: formData.deposit_commission_percentage,
          withdraw_commission_percentage: formData.withdraw_commission_percentage,
          wager_milestone_amount: formData.wager_milestone_amount,
          wager_bonus_amount: formData.wager_bonus_amount,
          updated_at: new Date().toISOString()
        })
        .eq("id", settings.id);

      if (error) throw error;
      setMessage({ type: "success", text: "Referral settings updated successfully!" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // সার্চ ফিল্টার
  const filteredReferrals = referrals.filter((ref) => 
    ref.referrer?.game_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred?.game_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Referral Data...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user referrals and commission settings.</p>
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
            onClick={fetchData} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
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

      {/* রেফারেল সেটিংস কার্ড */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Commission Settings</h2>
        <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Minimum Deposit Required (৳)</label>
            <input
              type="number"
              name="min_deposit_required"
              value={formData.min_deposit_required}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Fixed Join Bonus (৳)</label>
            <input
              type="number"
              name="fixed_join_bonus"
              value={formData.fixed_join_bonus}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Deposit Commission (%)</label>
            <input
              type="number"
              step="0.01"
              name="deposit_commission_percentage"
              value={formData.deposit_commission_percentage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Withdraw Commission (%)</label>
            <input
              type="number"
              step="0.01"
              name="withdraw_commission_percentage"
              value={formData.withdraw_commission_percentage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Wager Milestone (৳)</label>
            <input
              type="number"
              name="wager_milestone_amount"
              value={formData.wager_milestone_amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Milestone Bonus (৳)</label>
            <input
              type="number"
              name="wager_bonus_amount"
              value={formData.wager_bonus_amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
              type="submit"
              disabled={savingSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Update Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* রেফারেল টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Referrer</th>
                <th className="p-4 font-semibold">Referred User</th>
                <th className="p-4 font-semibold">Deposit Amount</th>
                <th className="p-4 font-semibold">Bonus Amount</th>
                <th className="p-4 font-semibold">Total Wager</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No referrals found.</td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-500">
                      {new Date(ref.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {ref.referrer?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {ref.referred?.game_id || "Unknown"}
                    </td>
                    <td className="p-4 text-gray-700">
                      ৳{Number(ref.deposit_amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-green-600 font-bold">
                      ৳{Number(ref.bonus_amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700">
                      ৳{Number(ref.total_wager || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ref.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                        ref.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                        "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}>
                        {ref.status.toUpperCase()}
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
