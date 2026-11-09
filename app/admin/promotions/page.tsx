"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // মডাল (Add/Edit) স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    image_url: "",
    category: "other",
    valid_until: "",
    button_link: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setPromotions(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  // নতুন প্রমোশন অ্যাড করার জন্য মডাল ওপেন
  const openAddModal = () => {
    setFormData({
      id: "",
      title: "",
      image_url: "",
      category: "other",
      valid_until: "",
      button_link: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // এডিট করার জন্য মডাল ওপেন
  const openEditModal = (promo: any) => {
    setFormData({
      id: promo.id,
      title: promo.title || "",
      image_url: promo.image_url || "",
      category: promo.category || "other",
      valid_until: promo.valid_until || "",
      button_link: promo.button_link || "",
      is_active: promo.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  // ডাটা সেভ করা (Insert or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        title: formData.title,
        image_url: formData.image_url,
        category: formData.category,
        valid_until: formData.valid_until,
        button_link: formData.button_link,
        is_active: formData.is_active,
      };

      if (formData.id) {
        // Update
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Promotion updated successfully!" });
      } else {
        // Insert
        const { error } = await supabase.from("promotions").insert([payload]);
        if (error) throw error;
        setMessage({ type: "success", text: "Promotion added successfully!" });
      }

      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // ডিলিট করা
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;

    try {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
      setMessage({ type: "success", text: "Promotion deleted successfully!" });
      fetchPromotions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // অ্যাক্টিভ/ইনঅ্যাক্টিভ টগল করা
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      fetchPromotions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // সার্চ ফিল্টার
  const filteredPromotions = promotions.filter((promo) =>
    promo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Promotions...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage banners, images, and links for the user app.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={openAddModal} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* প্রমোশন টেবিল */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Image</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Valid Until</th>
                <th className="p-4 font-semibold">Button Link</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No promotions found.</td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4">
                      <img 
                        src={promo.image_url} 
                        alt={promo.title} 
                        className="w-16 h-10 object-cover rounded bg-gray-200"
                        onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/100x60?text=No+Image"}
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-900 max-w-[200px] truncate">
                      {promo.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs uppercase font-semibold">
                        {promo.category || "other"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {promo.valid_until || "N/A"}
                    </td>
                    <td className="p-4 text-blue-600 truncate max-w-[150px]">
                      {promo.button_link || "N/A"}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleActive(promo.id, promo.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          promo.is_active 
                            ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {promo.is_active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(promo)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(promo.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-bold transition-colors"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {formData.id ? "Edit Promotion" : "Add New Promotion"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. First Deposit Bonus"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Image URL</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="electronic">Electronic</option>
                    <option value="rebate">Rebate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Valid Until</label>
                  <input
                    type="text"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleInputChange}
                    placeholder="e.g. 2024/12/31"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Button Link (Redirect URL)</label>
                <input
                  type="text"
                  name="button_link"
                  value={formData.button_link}
                  onChange={handleInputChange}
                  placeholder="e.g. /user/promotion/deposit"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Active / Visible on User App</label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
