"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    redirect_url: "",
    notice_text: "",
    serial: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .order("serial", { ascending: true });

      if (error) throw error;
      if (data) setBanners(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (banner: any = null) => {
    setEditingBanner(banner);
    if (banner) {
      setFormData({
        title: banner.title || "",
        image_url: banner.image_url || "",
        redirect_url: banner.redirect_url || "",
        notice_text: banner.notice_text || "",
        serial: Number(banner.serial) || 0,
      });
    } else {
      setFormData({
        title: "",
        image_url: "",
        redirect_url: "",
        notice_text: "",
        serial: banners.length + 1,
      });
    }
    setIsModalOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        title: formData.title.trim(),
        image_url: formData.image_url.trim(),
        redirect_url: formData.redirect_url.trim(),
        notice_text: formData.notice_text.trim(),
        serial: Number(formData.serial),
      };

      if (editingBanner) {
        // আপডেট
        const { error } = await supabase
          .from("home_banners")
          .update(payload)
          .eq("id", editingBanner.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Banner updated successfully!" });
      } else {
        // নতুন ইনসার্ট
        const { error } = await supabase
          .from("home_banners")
          .insert([payload]);

        if (error) throw error;
        setMessage({ type: "success", text: "New Banner added successfully!" });
      }

      setIsModalOpen(false);
      fetchBanners();
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
        .from("home_banners")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      const { error } = await supabase
        .from("home_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBanners(banners.filter(b => b.id !== id));
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Banners...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners & Notice</h1>
          <p className="text-gray-500 text-sm mt-1">Manage homepage slider images and scrolling notice.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Banner
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
                <th className="p-4 font-semibold">Serial</th>
                <th className="p-4 font-semibold">Preview</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Notice Text</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No banners found.</td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 font-bold text-gray-900">#{banner.serial}</td>
                    <td className="p-4">
                      {banner.image_url ? (
                        <img src={banner.image_url} alt="banner" className="w-24 h-12 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-24 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No Img</div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{banner.title || "Untitled"}</td>
                    <td className="p-4 text-gray-500 truncate max-w-[200px]" title={banner.notice_text}>
                      {banner.notice_text || "-"}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(banner.id, banner.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          banner.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {banner.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => openModal(banner)} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)} 
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
              {editingBanner ? `Edit Banner` : "Add New Banner"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Banner Title (Internal)</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Welcome Bonus"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/banner.png"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Redirect URL (Optional)</label>
                <input
                  type="text"
                  name="redirect_url"
                  value={formData.redirect_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="/promotion"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Scrolling Notice Text</label>
                <textarea
                  name="notice_text"
                  value={formData.notice_text}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none h-20"
                  placeholder="e.g. Daily first deposit bonus 20%!"
                />
                <p className="text-xs text-gray-400 mt-1">This text will scroll on the homepage.</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Serial (Order)</label>
                <input
                  type="number"
                  name="serial"
                  value={formData.serial}
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
                  {saving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
