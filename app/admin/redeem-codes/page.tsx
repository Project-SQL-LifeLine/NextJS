"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminRedeemCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    code: "",
    bonus_amount: 0,
    min_turnover_required: 0,
    turnover_multiplier: 1,
    expiry_date: "",
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("free_redeem_code_generate")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setCodes(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // র‍্যান্ডম কোড জেনারেট করার ফাংশন
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateCode = () => {
    setFormData({ ...formData, code: generateRandomCode() });
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
      // চেক করা: কোডটি আগে থেকে আছে কি না
      const { data: existing } = await supabase
        .from("free_redeem_code_generate")
        .select("id")
        .eq("code", formData.code.trim().toUpperCase())
        .maybeSingle();

      if (existing) {
        throw new Error("This code already exists. Please generate a new one.");
      }

      const { error } = await supabase
        .from("free_redeem_code_generate")
        .insert([{
          code: formData.code.trim().toUpperCase(),
          bonus_amount: Number(formData.bonus_amount),
          min_turnover_required: Number(formData.min_turnover_required),
          turnover_multiplier: Number(formData.turnover_multiplier),
          expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
        }]);

      if (error) throw error;

      setMessage({ type: "success", text: "New Redeem Code created successfully!" });
      setIsModalOpen(false);
      setFormData({ code: "", bonus_amount: 0, min_turnover_required: 0, turnover_multiplier: 1, expiry_date: "" });
      fetchCodes();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("free_redeem_code_generate")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setCodes(codes.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this code?")) return;
    
    try {
      const { error } = await supabase
        .from("free_redeem_code_generate")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCodes(codes.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Redeem Codes...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redeem Code Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage promotional codes for users.</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); handleGenerateCode(); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create New Code
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Bonus (৳)</th>
                <th className="p-4 font-semibold">Req. Turnover (৳)</th>
                <th className="p-4 font-semibold">Expiry Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No redeem codes found.</td>
                </tr>
              ) : (
                codes.map((c) => {
                  const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                      <td className="p-4 font-bold text-gray-900 font-mono">{c.code}</td>
                      <td className="p-4 text-green-600 font-bold">৳{Number(c.bonus_amount).toLocaleString()}</td>
                      <td className="p-4 text-gray-700">৳{Number(c.min_turnover_required).toLocaleString()}</td>
                      <td className="p-4 text-gray-500">
                        {c.expiry_date ? new Date(c.expiry_date).toLocaleString() : "No Expiry"}
                        {isExpired && <span className="ml-2 text-xs text-red-500 font-bold">(Expired)</span>}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleStatus(c.id, c.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            c.is_active && !isExpired
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {c.is_active && !isExpired ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(c.id)} 
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Redeem Code</h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Code (Unique)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={handleGenerateCode}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 rounded-lg text-sm font-bold whitespace-nowrap transition-colors"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Bonus Amount (৳)</label>
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
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Minimum Turnover Required (৳)</label>
                <input
                  type="number"
                  name="min_turnover_required"
                  value={formData.min_turnover_required}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
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
                  {saving ? "Creating..." : "Create Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
