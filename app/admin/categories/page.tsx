"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client"; // পাথ চেক করে নিন

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // মডাল স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট (নতুন ফিল্ডগুলো যোগ করা হয়েছে)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    icon_name: "gamepad",
    link_url: "https://www.yourlink.com",
    serial: 0,
    image_path: "", // নতুন: ছবির পাথ
    is_game: false, // নতুন: এটি কি গেম?
    display_home: true, // নতুন: হোমে দেখাবে?
    display_game_hub: false, // নতুন: গেম পেজে দেখাবে?
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
      const locations = category.display_locations || [];
      setFormData({
        title: category.title || "",
        slug: category.slug || "",
        icon_name: category.icon_name || "gamepad",
        link_url: category.link_url || "",
        serial: Number(category.serial) || 0,
        image_path: category.image_path || "",
        is_game: category.is_game || false,
        display_home: locations.includes("home"),
        display_game_hub: locations.includes("game_hub"),
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        icon_name: "gamepad",
        link_url: "",
        serial: categories.length + 1,
        image_path: "",
        is_game: false,
        display_home: true,
        display_game_hub: false,
      });
    }
    setIsModalOpen(true);
    setMessage({ type: "", text: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // লোকেশন অ্যারে তৈরি করা
      const locations = [];
      if (formData.display_home) locations.push("home");
      if (formData.display_game_hub) locations.push("game_hub");

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        icon_name: formData.icon_name,
        link_url: formData.link_url.trim(),
        serial: Number(formData.serial),
        image_path: formData.image_path.trim(),
        is_game: formData.is_game,
        display_locations: locations,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("home_categories_create")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Category updated successfully!" });
      } else {
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
    if (!confirm("Are you sure you want to delete this?")) return;
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
          <h1 className="text-2xl font-bold text-gray-900">Game & Category Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Manage games and categories for Home and Game Hub.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New
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
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Serial</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Locations</th>
                <th className="p-4 font-semibold">Image Path</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No data found.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="p-4 font-bold text-gray-900">#{cat.serial}</td>
                    <td className="p-4 font-bold text-gray-900">{cat.title}</td>
                    <td className="p-4">
                      {cat.is_game ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">GAME</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">CATEGORY</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {cat.display_locations?.map((loc: string) => (
                          <span key={loc} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-100">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs max-w-[150px] truncate">
                      {cat.image_path || "N/A"}
                    </td>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory ? `Edit: ${editingCategory.title}` : "Add New"}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Dice Game"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    placeholder="e.g. dice-game"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-1 block">Icon Name</label>
                  <select
                    name="icon_name"
                    value={formData.icon_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="gamepad">Gamepad</option>
                    <option value="coins">Coins</option>
                    <option value="dice">Dice</option>
                    <option value="fire">Fire</option>
                    <option value="star">Star</option>
                    <option value="trophy">Trophy</option>
                  </select>
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
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Link URL (Route)</label>
                <input
                  type="text"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. /Games/Spribe/dice"
                  required
                />
              </div>

              {/* নতুন: Image Path */}
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Image Path (from public folder)</label>
                <input
                  type="text"
                  name="image_path"
                  value={formData.image_path}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  placeholder="e.g. /images/games/dice.png"
                />
                <p className="text-xs text-gray-400 mt-1">Put your image in public folder and paste the path here.</p>
              </div>

              {/* নতুন: Is Game? */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  name="is_game"
                  id="is_game"
                  checked={formData.is_game}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_game" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Is this a playable Game? (Uncheck for normal category)
                </label>
              </div>

              {/* নতুন: Display Locations */}
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-2 block">Where to display?</label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="display_home"
                      id="display_home"
                      checked={formData.display_home}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="display_home" className="text-sm text-gray-700">Home Page</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="display_game_hub"
                      id="display_game_hub"
                      checked={formData.display_game_hub}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="display_game_hub" className="text-sm text-gray-700">Game Hub (app/Game)</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
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
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
