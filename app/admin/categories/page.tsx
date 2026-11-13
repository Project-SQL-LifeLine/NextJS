"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client"; 

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট (নতুন show_category_ribbon যোগ করা হলো)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    icon_name: "gamepad",
    link_url: "",
    serial: 0,
    image_path: "",
    is_game: false,
    category_group: "General",
    display_home: true,
    display_game_hub: false,
    theme_color: "#8b5cf6",
    show_title: true, 
    show_category_ribbon: true, // 👈 নতুন স্টেট
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
        category_group: category.category_group || "General",
        display_home: locations.includes("home"),
        display_game_hub: locations.includes("game_hub"),
        theme_color: category.theme_color || "#8b5cf6",
        show_title: category.show_title !== undefined ? category.show_title : true,
        show_category_ribbon: category.show_category_ribbon !== undefined ? category.show_category_ribbon : true, // 👈
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
        category_group: "General",
        display_home: true,
        display_game_hub: false,
        theme_color: "#8b5cf6",
        show_title: true,
        show_category_ribbon: true, // 👈
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
        category_group: formData.category_group.trim(),
        display_locations: locations,
        theme_color: formData.theme_color,
        show_title: formData.show_title, 
        show_category_ribbon: formData.show_category_ribbon, // 👈 পেলোডে যোগ হলো
      };

      if (editingCategory) {
        const { error } = await supabase.from("home_categories_create").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
        setMessage({ type: "success", text: "Updated successfully!" });
      } else {
        const { error } = await supabase.from("home_categories_create").insert([payload]);
        if (error) throw error;
        setMessage({ type: "success", text: "Added successfully!" });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert("Error: " + err.message);
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("home_categories_create").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from("home_categories_create").delete().eq("id", id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) { alert("Error: " + err.message); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game Manager</h1>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-semibold">Serial</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Group</th>
              <th className="p-4 font-semibold">Color</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Ribbon</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-4 font-bold">#{cat.serial}</td>
                <td className="p-4 font-bold text-gray-900">{cat.title}</td>
                <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{cat.category_group}</span></td>
                <td className="p-4">
                   <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: cat.theme_color || '#22c55e' }}></div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${cat.show_title ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.show_title ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${cat.show_category_ribbon !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.show_category_ribbon !== false ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => toggleStatus(cat.id, cat.is_active)} className={`px-3 py-1 rounded-full text-xs font-bold ${cat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  <button onClick={() => openModal(cat)} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-xs font-bold">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-xs font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingCategory ? "Edit Item" : "Add New Item"}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Slug</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono text-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Category Group</label>
                  <input type="text" name="category_group" value={formData.category_group} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Serial (Order)</label>
                  <input type="number" name="serial" value={formData.serial} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Card Theme Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="theme_color" value={formData.theme_color} onChange={handleChange} className="w-10 h-10 p-0 border-0 rounded cursor-pointer" />
                  <input type="text" name="theme_color" value={formData.theme_color} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono text-sm uppercase" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Route URL</label>
                <input type="text" name="link_url" value={formData.link_url} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono text-sm" required />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Image URL</label>
                <input type="text" name="image_path" value={formData.image_path} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono text-sm" />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                <input type="checkbox" name="is_game" id="is_game" checked={formData.is_game} onChange={handleChange} className="w-5 h-5" />
                <label htmlFor="is_game" className="text-sm font-bold">Is this a playable Game?</label>
              </div>

              {/* 👇 টাইটেল অন/অফ সুইচ */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                <label htmlFor="show_title" className="text-sm font-bold cursor-pointer">Show Game Title (Bottom Text)</label>
                <input 
                  type="checkbox" 
                  name="show_title" 
                  id="show_title" 
                  checked={formData.show_title} 
                  onChange={handleChange} 
                  className="w-6 h-6 cursor-pointer accent-blue-600"
                />
              </div>

              {/* 👇 রিবন অন/অফ সুইচ (নতুন) */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                <label htmlFor="show_category_ribbon" className="text-sm font-bold cursor-pointer">Show Category Ribbon (Top Bar)</label>
                <input 
                  type="checkbox" 
                  name="show_category_ribbon" 
                  id="show_category_ribbon" 
                  checked={formData.show_category_ribbon} 
                  onChange={handleChange} 
                  className="w-6 h-6 cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Where to display?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="display_home" checked={formData.display_home} onChange={handleChange} className="w-4 h-4" /> Home Page</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="display_game_hub" checked={formData.display_game_hub} onChange={handleChange} className="w-4 h-4" /> Game Hub</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
