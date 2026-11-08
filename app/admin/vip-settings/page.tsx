"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminVipSettingsPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null); // null মানে নতুন অ্যাড হবে
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    tier_name: "",
    level_name: "",
    required_wager: 0,
    bonus_amount: 0,
    rakeback_percentage: 0.50,
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  // ডাটা ফেচ করা
  const fetchLevels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vip_level_settings_amount_control")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      if (data) setLevels(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // মডাল ওপেন (Add / Edit)
  const openModal = (level: any = null) => {
    setEditingLevel(level);
    if (level) {
      setFormData({
        tier_name: level.tier_name || "",
        level_name: level.level_name || "",
        required_wager: Number(level.required_wager),
        bonus_amount: Number(level.bonus_amount),
        rakeback_percentage: Number(level.rakeback_percentage || 0),
      });
    } else {
      // নতুন অ্যাড করার জন্য ফাঁকা ফর্ম
      setFormData({
        tier_name: "",
        level_name: "",
        required_wager: 0,
        bonus_amount: 0,
        rakeback_percentage: 0.50,
      });
    }
    setIsModalOpen(true);
    setMessage({ type: "", text: "" });
  };

  // ফর্ম ইনপুট হ্যান্ডেল
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // সেভ করা (Add / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingLevel) {
        // আপডেট
        const { error } = await supabase
          .from("vip_level_settings_amount_control")
          .update({
            tier_name: formData.tier_name,
            level_name: formData.level_name,
            required_wager: Number(formData.required_wager),
            bonus_amount: Number(formData.bonus_amount),
            rakeback_percentage: Number(formData.rakeback_percentage),
          })
          .eq("id", editingLevel.id);

        if (error) throw error;
        setMessage({ type: "success", text: "VIP Level updated successfully!" });
      } else {
        // নতুন ইনসার্ট (ID ম্যানুয়ালি বের করা)
        const maxId = levels.length > 0 ? Math.max(...levels.map(l => l.id)) : 0;
        const newId = maxId + 1;

        const { error } = await supabase
          .from("vip_level_settings_amount_control")
          .insert([{
            id: newId,
            tier_name: formData.tier_name,
            level_name: formData.level_name,
            required_wager: Number(formData.required_wager),
            bonus_amount: Number(formData.bonus_amount),
            rakeback_percentage: Number(formData.rakeback_percentage),
          }]);

        if (error) throw error;
        setMessage({ type: "success", text: "New VIP Level added successfully!" });
      }

      setIsModalOpen(false);
      fetchLevels(); // রিফ্রেশ
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // স্ট্যাটাস টগল (Active / Inactive)
  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("vip_level_settings_amount_control")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setLevels(levels.map(l => l.id === id ? { ...l, is_active: !currentStatus } : l));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  // ডিলিট করা
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this VIP level? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("vip_level_settings_amount_control")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setLevels(levels.filter(l => l.id !== id));
      setMessage({ type: "success", text: "VIP Level deleted successfully!" });
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading VIP Settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VIP Level Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage VIP wager requirements and bonus amounts.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Level
        </button>
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
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Tier</th>
                <th className="p-4 font-semibold">Level Name</th>
                <th className="p-4 font-semibold">Required Wager</th>
                <th className="p-4 font-semibold">Bonus Amount</th>
                <th className="p-4 font-semibold">Rakeback %</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                  <td className="p-4 font-bold text-gray-900">#{level.id}</td>
                  <td className="p-4 text-gray-700">{level.tier_name}</td>
                  <td className="p-4 font-semibold text-gray-900">{level.level_name}</td>
                  <td className="p-4 text-blue-600 font-bold">৳{Number(level.required_wager).toLocaleString()}</td>
                  <td className="p-4 text-green-600 font-bold">৳{Number(level.bonus_amount).toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{level.rakeback_percentage}%</td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleStatus(level.id, level.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        level.is_active 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {level.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4 text-right flex gap-2 justify-end">
                    <button 
                      onClick={() => openModal(level)} 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(level.id)} 
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingLevel ? `Edit Level: ${editingLevel.level_name}` : "Add New VIP Level"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Tier Name</label>
                  <input
                    type="text"
                    name="tier_name"
                    value={formData.tier_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Bronze"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Level Name</label>
                  <input
                    type="text"
                    name="level_name"
                    value={formData.level_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Bronze I"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Required Wager (৳)</label>
                <input
                  type="number"
                  name="required_wager"
                  value={formData.required_wager}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Level-up Bonus Amount (৳)</label>
                <input
                  type="number"
                  name="bonus_amount"
                  value={formData.bonus_amount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Rakeback Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="rakeback_percentage"
                  value={formData.rakeback_percentage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
