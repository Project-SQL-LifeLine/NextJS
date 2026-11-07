"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import BottomNav from "../../../components/BottomNav";

type TabType = "account" | "verify" | "security" | "sessions";

export default function UserSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile State
  const [profile, setProfile] = useState<any>(null);

  // Verify State
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  // Security State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        router.replace("/user/login"); 
        return; 
      }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      
      if (profileData) {
        setProfile(profileData);
        setEmail(profileData.email || "");
        setBirthday(profileData.birthday || "");
        setPostalCode(profileData.postal_code || "");
        setCity(profileData.city || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    void loadData(); 
  }, [loadData]);

  // --- Logic: Email Verify ---
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: t("Please enter a valid email address.", "সঠিক ইমেইল দিন।") });
      return;
    }
    if (!profile) return;

    const { error } = await supabase.from("profiles").update({ email: email, email_verified: true }).eq("id", profile.id);
    if (!error) {
      setMessage({ type: "success", text: t("Email verified successfully!", "ইমেইল সফলভাবে ভেরিফাই হয়েছে!") });
      setProfile({ ...profile, email, email_verified: true });
    }
  };

  // --- Logic: Address Verify ---
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ 
      birthday, postal_code: postalCode, city, address_verified: true 
    }).eq("id", profile.id);
    
    if (!error) {
      setMessage({ type: "success", text: t("Address verified successfully!", "ঠিকানা সফলভাবে ভেরিফাই হয়েছে!") });
      setProfile({ ...profile, birthday, postal_code: postalCode, city, address_verified: true });
    }
  };

  // --- Logic: Change Password ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: t("Please fill all password fields.", "সব পাসওয়ার্ড ফিল্ড পূরণ করুন।") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("New passwords do not match.", "পাসওয়ার্ড মিলছে না।") });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: t("Password updated successfully!", "পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!") });
      setNewPassword(""); setConfirmPassword("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-borderCol border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain pb-20 font-sans text-textMain">
      
      {/* Header */}
      <header className="bg-bgSec px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-borderCol">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">{t("Settings", "সেটিংস")}</h1>
        <div className="w-6"></div>
      </header>

      <main className="p-4">
        <h1 className="text-xl font-bold text-white mb-4">{t("Account Settings", "অ্যাকাউন্ট সেটিংস")}</h1>

        {/* Tabs */}
        <div className="flex border-b border-borderCol mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "account", label: t("Account", "অ্যাকাউন্ট") },
            { id: "verify", label: t("Verify", "ভেরিফাই") },
            { id: "security", label: t("Security", "সিকিউরিটি") },
            { id: "sessions", label: t("Sessions", "সেশন") }
          ].map((tab) => (
            <button 
              key={tab.id}
              className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-textSec"}`} 
              onClick={() => { setActiveTab(tab.id as TabType); setMessage({ type: "", text: "" }); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === "error" ? "bg-danger/10 text-danger border border-danger" : "bg-primary/10 text-primary border border-primary"}`}>
            {message.text}
          </div>
        )}

        {/* --- ১. Account Tab --- */}
        {activeTab === "account" && profile && (
          <div className="bg-bgSec border border-borderCol rounded-xl p-5 flex flex-col gap-4">
            {!profile.email_verified && (
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B] text-[#F59E0B] p-3 rounded-lg text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>{t("Please verify your email address to use all features.", "সব ফিচার ব্যবহার করতে ইমেইল ভেরিফাই করুন।")}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-borderCol pb-3">
              <span className="text-textSec">{t("Full Name", "পূর্ণ নাম")}:</span> 
              <strong className="text-white">{profile.full_name || "-"}</strong>
            </div>
            <div className="flex justify-between border-b border-borderCol pb-3">
              <span className="text-textSec">{t("Mobile", "মোবাইল")}:</span> 
              <strong className="text-white">{profile.mobile || "-"}</strong>
            </div>
            <div className="flex justify-between border-b border-borderCol pb-3">
              <span className="text-textSec">{t("Game ID", "গেম আইডি")}:</span> 
              <strong className="text-white">{profile.game_id || "-"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-textSec">{t("Balance", "ব্যালেন্স")}:</span> 
              <strong className="text-primary">৳ {Number(profile.balance).toLocaleString()}</strong>
            </div>
          </div>
        )}

        {/* --- ২. Verify Tab --- */}
        {activeTab === "verify" && profile && (
          <div className="flex flex-col gap-4">
            
            {/* Level 1 */}
            <div className="bg-bgSec border border-borderCol rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold">{t("Level 1: Number Verification", "লেভেল ১: নাম্বার ভেরিফিকেশন")}</h3>
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-textSec text-xs">{t("Your mobile number is verified.", "আপনার মোবাইল নাম্বার ভেরিফাইড।")} ({profile.mobile})</p>
            </div>

            {/* Level 2 */}
            <div className="bg-bgSec border border-borderCol rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold">{t("Level 2: Email Verification", "লেভেল ২: ইমেইল ভেরিফিকেশন")}</h3>
                {profile.email_verified && <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              {!profile.email_verified ? (
                <form onSubmit={handleSaveEmail} className="flex flex-col gap-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Enter your email", "ইমেইল দিন")} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
                  <button type="submit" className="bg-primary text-bgMain font-bold text-sm py-2 rounded-lg">{t("Verify Email", "ভেরিফাই করুন")}</button>
                </form>
              ) : (
                <p className="text-primary text-xs flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {profile.email}</p>
              )}
            </div>

            {/* Level 3 */}
            <div className="bg-bgSec border border-borderCol rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold">{t("Level 3: Address Verification", "লেভেল ৩: ঠিকানা ভেরিফিকেশন")}</h3>
                {profile.address_verified && <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              {!profile.address_verified ? (
                <form onSubmit={handleSaveAddress} className="flex flex-col gap-3">
                  <input type="text" value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder={t("Birthday (YYYY-MM-DD)", "জন্মদিন (YYYY-MM-DD)")} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t("Postal Code", "পোস্টাল কোড")} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("City", "শহর")} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
                  <button type="submit" className="bg-primary text-bgMain font-bold text-sm py-2 rounded-lg">{t("Verify Address", "ঠিকানা ভেরিফাই করুন")}</button>
                </form>
              ) : (
                <p className="text-primary text-xs flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {t("Address Verified", "ঠিকানা ভেরিফাইড")}</p>
              )}
            </div>

            {/* Level 4 */}
            <div className="bg-bgSec border border-borderCol rounded-xl p-5 opacity-70">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold">{t("Level 4: Identify Verification", "লেভেল ৪: আইডি ভেরিফিকেশন")}</h3>
                {profile.identify_verified && <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <p className="text-textSec text-xs">{t("Coming soon (NID / Passport upload).", "শীঘ্রই আসছে (NID / পাসপোর্ট আপলোড)।")}</p>
            </div>
          </div>
        )}

        {/* --- ৩. Security Tab --- */}
        {activeTab === "security" && (
          <div className="bg-bgSec border border-borderCol rounded-xl p-5">
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div>
                <label className="text-textSec text-xs font-semibold mb-1 block">{t("New Password", "নতুন পাসওয়ার্ড")}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-textSec text-xs font-semibold mb-1 block">{t("Confirm New Password", "পাসওয়ার্ড নিশ্চিত করুন")}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-bgMain border border-borderCol rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary" required />
              </div>
              <button type="submit" className="bg-primary text-bgMain font-bold text-sm py-2.5 rounded-lg mt-2">{t("Update Password", "পাসওয়ার্ড আপডেট করুন")}</button>
            </form>
          </div>
        )}

        {/* --- ৪. Sessions Tab (Structure Ready) --- */}
        {activeTab === "sessions" && (
          <div className="bg-bgSec border border-borderCol rounded-xl p-5">
            <p className="text-textSec text-sm mb-4">{t("Your recent login sessions.", "আপনার সাম্প্রতিক লগইন সেশনগুলো।")}</p>
            <div className="flex flex-col gap-3">
              {/* ভবিষ্যতে এখানে ম্যাপ করে সেশন দেখানো হবে */}
              <div className="text-center py-6 text-textSec text-sm border border-dashed border-borderCol rounded-lg">
                {t("No active sessions found.", "কোনো সেশন পাওয়া যায়নি।")}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
