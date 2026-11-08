"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    method_name: "",
    method_logo_url: "",
    payment_channels: "", // UI-তে কমা দিয়ে আলাদা করা হবে
    min_deposit: 500,
    max_deposit: 30000,
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("control_payment_method")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setMethods(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (method: any = null) => {
    setEditingMethod(method);
    if (method) {
      setFormData({
        method_name: method.method_name || "",
        method_logo_url: method.method_logo_url || "",
        payment_channels: method.payment_channels?.join(", ") || "",
        min_deposit: Number(method.min_deposit) || 500,
        max_deposit: Number(method.max_deposit) || 30000,
      });
    } else {
      setFormData({
        method_name: "",
        method_logo_url: "",
        payment_channels: "HRPAY, MEGIpay, TKPAY",
        min_deposit: 500,
        max_deposit: 30000,
      });
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
      // চ্যানেলগুলোকে কমা দিয়ে স্প্লিট করে অ্যারে বানানো
      const channelsArray = formData.payment_channels
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c !== "");

      const payload = {
        method_name: formData.method_name.trim(),
        method_logo_url: formData.method_logo_url.trim(),
        payment_channels: channelsArray,
        min_deposit: Number(formData.min_deposit),
        max_deposit: Number(formData.max_deposit),
      };

      if (editingMethod) {
        // আপডেট
        const { error } = await supabase
          .from("control_payment_method")
          .update(payload)
          .eq("id", editingMethod.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Payment Method updated successfully!" });
      } else {
        // নতুন ইনসার্ট
        const { error } = await supabase
          .from("control_payment_method")
          .insert([payload]);

        if (error) throw error;
        setMessage({ type: "success", text: "New Payment Method added successfully!" });
      }

      setIsModalOpen(false);
      fetchMethods();
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
        .from("control_payment_method")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setMethods(methods.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    
    try {
      const { error } = await supabase
        .from("control_payment_method")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setMethods(methods.filter(m => m.id !== id));
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Payment Methods...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 text-sm mt-1">Manage deposit methods and payment channels.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Method
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
                <th className="p-4 font-semibold">Logo</th>
                <th className="p-4 font-semibold">Method Name</th>
                <th className="p-4 font-semibold">Channels</th>
                <th className="p-4 font-semibold">Min/Max Deposit</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {methods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No payment methods found.</td>
                </tr>
              ) : (
                methods.map((method) => (
                  <tr key={method.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4">
                      {method.method_logo_url ? (
                        <img src={method.method_logo_url} alt="logo" className="w-10 h-10 object-contain rounded-md border border-gray-200 bg-white p-1" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No Logo</div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{method.method_name}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {method.payment_channels?.map((ch: string, idx: number) => (
                          <span key={idx} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      Min: <span className="font-bold text-gray-900">৳{Number(method.min_deposit).toLocaleString()}</span><br/>
                      Max: <span className="font-bold text-gray-900">৳{Number(method.max_deposit).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(method.id, method.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          method.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {method.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => openModal(method)} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(method.id)} 
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMethod ? `Edit Method: ${editingMethod.method_name}` : "Add New Payment Method"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Method Name</label>
                <input
                  type="text"
                  name="method_name"
                  value={formData.method_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Bkash, Nagad"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Logo URL (Image Link)</label>
                <input
                  type="text"
                  name="method_logo_url"
                  value={formData.method_logo_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-400 mt-1">Provide a direct PNG/SVG image link.</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Payment Channels (Comma separated)</label>
                <input
                  type="text"
                  name="payment_channels"
                  value={formData.payment_channels}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="HRPAY, MEGIpay, TKPAY"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Min Deposit (৳)</label>
                  <input
                    type="number"
                    name="min_deposit"
                    value={formData.min_deposit}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Max Deposit (৳)</label>
                  <input
                    type="number"
                    name="max_deposit"
                    value={formData.max_deposit}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
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
                  {saving ? "Saving..." : "Save Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
