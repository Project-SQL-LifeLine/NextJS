"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    bonus_name: "",
    bonus_percentage: 0,
    turnover_multiplier: 1,
  });

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bonus_settings")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      if (data) setBonuses(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (bonus: any = null) => {
    setEditingBonus(bonus);
    if (bonus) {
      setFormData({
        bonus_name: bonus.bonus_name || "",
        bonus_percentage: Number(bonus.bonus_percentage) || 0,
        turnover_multiplier: Number(bonus.turnover_multiplier) || 1,
      });
    } else {
      setFormData({ bonus_name: "", bonus_percentage: 0, turnover_multiplier: 1 });
    }
    setIsModalOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        bonus_name: formData.bonus_name.trim(),
        bonus_percentage: Number(formData.bonus_percentage),
        turnover_multiplier: Number(formData.turnover_multiplier),
      };

      if (editingBonus) {
        // আপডেট
        const { error } = await supabase
          .from("bonus_settings")
          .update(payload)
          .eq("id", editingBonus.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Bonus updated successfully!" });
      } else {
        // নতুন ইনসার্ট
        const { error } = await supabase
          .from("bonus_settings")
          .insert([payload]);

        if (error) throw error;
        setMessage({ type: "success", text: "New Bonus added successfully!" });
      }

      setIsModalOpen(false);
      fetchBonuses();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("bonus_settings")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setBonuses(bonuses.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bonus?")) return;
    
    try {
      const { error } = await supabase
        .from("bonus_settings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBonuses(bonuses.filter(b => b.id !== id));
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Bonus Settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonus Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage deposit bonuses and turnover multipliers.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Bonus
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
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Bonus Name</th>
                <th className="p-4 font-semibold">Percentage (%)</th>
                <th className="p-4 font-semibold">Turnover (x)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bonuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No bonuses found.</td>
                </tr>
              ) : (
                bonuses.map((bonus) => (
                  <tr key={bonus.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 font-bold text-gray-900">#{bonus.id}</td>
                    <td className="p-4 font-bold text-gray-900">{bonus.bonus_name}</td>
                    <td className="p-4 text-green-600 font-bold">{Number(bonus.bonus_percentage)}%</td>
                    <td className="p-4 text-blue-600 font-bold">x{Number(bonus.turnover_multiplier)}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(bonus.id, bonus.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          bonus.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {bonus.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => openModal(bonus)} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(bonus.id)} 
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingBonus ? `Edit Bonus: ${editingBonus.bonus_name}` : "Add New Bonus"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Bonus Name</label>
                <input
                  type="text"
                  name="bonus_name"
                  value={formData.bonus_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 150% BONUS"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Bonus Percentage (%)</label>
                <input
                  type="number"
                  name="bonus_percentage"
                  value={formData.bonus_percentage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Turnover Multiplier (x)</label>
                <input
                  type="number"
                  step="0.01"
                  name="turnover_multiplier"
                  value={formData.turnover_multiplier}
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
                  {saving ? "Saving..." : "Save Bonus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
