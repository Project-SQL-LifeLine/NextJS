"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminReferralPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // সেটিংস ফর্ম স্টেট
  const [commissionValue, setCommissionValue] = useState(5);
  const [minDeposit, setMinDeposit] = useState(300);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. রেফারেল ডাটা আনা (রেফারার এবং রেফার্ড ইউজারের গেম আইডিসহ)
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

      // ২. রেফারেল কমিশন সেটিংস আনা
      const { data: setData, error: setError } = await supabase
        .from("referral_commission_control")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!setError && setData) {
        setSettings(setData);
        setCommissionValue(Number(setData.commission_value));
        setMinDeposit(Number(setData.min_deposit_required));
      }

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // রেফারেল Approve বা Reject করা
  const handleAction = async (referral: any, status: "approved" | "rejected") => {
    setProcessing(referral.id);
    setMessage({ type: "", text: "" });

    try {
      if (status === "approved") {
        // ১. রেফারেল স্ট্যাটাস আপডেট
        const { error: statusError } = await supabase
          .from("user_invited_friend_referral")
          .update({ status: "approved" })
          .eq("id", referral.id);
        if (statusError) throw statusError;

        // ২. রেফারারকে বোনাস দেওয়া (referral_earnings এ যোগ করা)
        const { data: profile } = await supabase
          .from("profiles")
          .select("referral_earnings")
          .eq("id", referral.referrer_id)
          .single();

        const currentEarnings = Number(profile?.referral_earnings || 0);
        const newEarnings = currentEarnings + Number(referral.bonus_amount);

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ referral_earnings: newEarnings })
          .eq("id", referral.referrer_id);
        
        if (profileError) throw profileError;

        setMessage({ type: "success", text: "Referral Approved and bonus added to referrer's earnings!" });

      } else {
        // Reject Logic
        const { error } = await supabase
          .from("user_invited_friend_referral")
          .update({ status: "rejected" })
          .eq("id", referral.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Referral Rejected." });
      }

      fetchData(); // রিফ্রেশ লিস্ট

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
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
          commission_value: commissionValue,
          min_deposit_required: minDeposit,
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
        <form onSubmit={handleUpdateSettings} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Commission Percentage (%)</label>
            <input
              type="number"
              value={commissionValue}
              onChange={(e) => setCommissionValue(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-600 font-semibold mb-1 block">Minimum Deposit Required (৳)</label>
            <input
              type="number"
              value={minDeposit}
              onChange={(e) => setMinDeposit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={savingSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {savingSettings ? "Saving..." : "Update Settings"}
          </button>
        </form>
      </div>

      {/* রেফারেল টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Referrer (Inviter)</th>
                <th className="p-4 font-semibold">Referred User</th>
                <th className="p-4 font-semibold">Deposit Amount</th>
                <th className="p-4 font-semibold">Bonus Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
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
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ref.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                        ref.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                        "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}>
                        {ref.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      {ref.status === "pending" ? (
                        <>
                          <button 
                            onClick={() => handleAction(ref, "approved")}
                            disabled={processing === ref.id}
                            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                          >
                            {processing === ref.id ? "..." : "Approve"}
                          </button>
                          <button 
                            onClick={() => handleAction(ref, "rejected")}
                            disabled={processing === ref.id}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Processed</span>
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
