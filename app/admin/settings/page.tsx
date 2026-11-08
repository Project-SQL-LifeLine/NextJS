"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    site_name: "",
    support_link: "",
    min_withdrawal: 100,
    max_withdrawal: 25000,
    maintenance_mode: false,
    maintenance_message: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          site_name: data.site_name || "",
          support_link: data.support_link || "",
          min_withdrawal: Number(data.min_withdrawal),
          max_withdrawal: Number(data.max_withdrawal),
          maintenance_mode: data.maintenance_mode,
          maintenance_message: data.maintenance_message || "",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        site_name: formData.site_name.trim(),
        support_link: formData.support_link.trim(),
        min_withdrawal: Number(formData.min_withdrawal),
        max_withdrawal: Number(formData.max_withdrawal),
        maintenance_mode: formData.maintenance_mode,
        maintenance_message: formData.maintenance_message.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("admin_settings")
        .update(payload)
        .eq("id", 1);

      if (error) throw error;
      setMessage({ type: "success", text: "Settings updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage global site settings and limits.</p>
      </div>

      {/* মেসেজ */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-semibold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* ফর্ম */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          {/* জেনারেল সেটিংস */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Site Name</label>
                <input
                  type="text"
                  name="site_name"
                  value={formData.site_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Support Link (Telegram/WhatsApp)</label>
                <input
                  type="text"
                  name="support_link"
                  value={formData.support_link}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* উইথড্র লিমিট */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 mt-4">Withdrawal Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Minimum Withdrawal (৳)</label>
                <input
                  type="number"
                  name="min_withdrawal"
                  value={formData.min_withdrawal}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-1 block">Maximum Withdrawal (৳)</label>
                <input
                  type="number"
                  name="max_withdrawal"
                  value={formData.max_withdrawal}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* মেইনটেন্যান্স মোড */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 mt-4">Maintenance Mode</h2>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                name="maintenance_mode"
                id="maintenance_mode"
                checked={formData.maintenance_mode}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="maintenance_mode" className="text-sm font-bold text-gray-800 cursor-pointer">
                Enable Maintenance Mode
              </label>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-semibold mb-1 block">Maintenance Message</label>
              <textarea
                name="maintenance_message"
                value={formData.maintenance_message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none h-24"
                placeholder="Message to show to users..."
              />
              <p className="text-xs text-gray-400 mt-1">This message will be displayed to all users if maintenance mode is enabled.</p>
            </div>
          </div>

          {/* সেভ বাটন */}
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
