"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    icon_name: "gamepad",
    link_url: "https://www.yourlink.com",
    serial: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("home_categories_create")
        .select("*")
        .order("serial", { ascending: true });

      if (error) throw error;
      if (data) setCategories(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category: any = null) => {
    setEditingCategory(category);
    if (category) {
      setFormData({
        title: category.title || "",
        slug: category.slug || "",
        icon_name: category.icon_name || "gamepad",
        link_url: category.link_url || "",
        serial: Number(category.serial) || 0,
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        icon_name: "gamepad",
        link_url: "https://www.yourlink.com",
        serial: categories.length + 1,
      });
    }
    setIsModalOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        icon_name: formData.icon_name,
        link_url: formData.link_url.trim(),
        serial: Number(formData.serial),
      };

      if (editingCategory) {
        // আপডেট
        const { error } = await supabase
          .from("home_categories_create")
          .update(payload)
          .eq("id", editingCategory.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Category updated successfully!" });
      } else {
        // নতুন ইনসার্ট
        const { error } = await supabase
          .from("home_categories_create")
          .insert([payload]);

        if (error) throw error;
        setMessage({ type: "success", text: "New Category added successfully!" });
      }

      setIsModalOpen(false);
      fetchCategories();
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
        .from("home_categories_create")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const { error } = await supabase
        .from("home_categories_create")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Categories...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage categories displayed on the homepage.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Category
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
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Slug</th>
                <th className="p-4 font-semibold">Icon Name</th>
                <th className="p-4 font-semibold">Link</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No categories found.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 font-bold text-gray-900">#{cat.serial}</td>
                    <td className="p-4 font-bold text-gray-900">{cat.title}</td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-xs font-mono">
                        {cat.icon_name}
                      </span>
                    </td>
                    <td className="p-4 text-blue-600 truncate max-w-[150px]">{cat.link_url}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(cat.id, cat.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          cat.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => openModal(cat)} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
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
              {editingCategory ? `Edit Category: ${editingCategory.title}` : "Add New Category"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Originals"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Slug (Unique)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  placeholder="e.g. originals"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Unique identifier (no spaces, use hyphen).</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Icon Name</label>
                <select
                  name="icon_name"
                  value={formData.icon_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="gamepad">Gamepad (Originals)</option>
                  <option value="coins">Coins (Slots)</option>
                  <option value="dice">Dice (Table Games)</option>
                  <option value="fire">Fire (Hot Games)</option>
                  <option value="star">Star (Featured)</option>
                  <option value="trophy">Trophy (Tournaments)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">SVG icon used on the homepage.</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Link URL</label>
                <input
                  type="text"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                  required
                />
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
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
