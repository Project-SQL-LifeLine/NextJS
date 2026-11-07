"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header"; // Header ইমপোর্ট করা হলো
import BottomNav from "../../../components/BottomNav";
import "./settings.css";

type TabType = "account" | "verify" | "security" | "sessions";

export default function UserSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Header এর জন্য স্টেট
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

      setIsLoggedIn(true);

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
      <div className="settings-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2B4236] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      
      {/* গ্লোবাল Header কম্পোনেন্ট যুক্ত করা হলো */}
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="settings-main pt-4">
        <h1 className="settings-title">{t("Account Settings", "অ্যাকাউন্ট সেটিংস")}</h1>

        {/* Tabs */}
        <div className="settings-tabs">
          {[
            { id: "account", label: t("Account", "অ্যাকাউন্ট") },
            { id: "verify", label: t("Verify", "ভেরিফাই") },
            { id: "security", label: t("Security", "সিকিউরিটি") },
            { id: "sessions", label: t("Sessions", "সেশন") }
          ].map((tab) => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""} 
              onClick={() => { setActiveTab(tab.id as TabType); setMessage({ type: "", text: "" }); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`settings-alert ${message.type}`}>{message.text}</div>
        )}

        {/* --- Account Tab --- */}
        {activeTab === "account" && profile && (
          <div className="settings-card">
            {!profile.email_verified && (
              <div className="verify-warning">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>{t("Please verify your email address to use all features.", "সব ফিচার ব্যবহার করতে ইমেইল ভেরিফাই করুন।")}</span>
              </div>
            )}
            <div className="info-row"><span>{t("Full Name", "পূর্ণ নাম")}:</span> <strong>{profile.full_name || "-"}</strong></div>
            <div className="info-row"><span>{t("Mobile", "মোবাইল")}:</span> <strong>{profile.mobile || "-"}</strong></div>
            <div className="info-row"><span>{t("Game ID", "গেম আইডি")}:</span> <strong>{profile.game_id || "-"}</strong></div>
            <div className="info-row"><span>{t("Balance", "ব্যালেন্স")}:</span> <strong className="text-green">৳ {Number(profile.balance).toLocaleString()}</strong></div>
          </div>
        )}

        {/* --- Verify Tab --- */}
        {activeTab === "verify" && profile && (
          <div className="verify-list">
            <div className="verify-card">
              <div className="verify-header">
                <h3>{t("Level 1: Number Verification", "লেভেল ১: নাম্বার ভেরিফিকেশন")}</h3>
                <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="verify-desc">{t("Your mobile number is verified.", "আপনার মোবাইল নাম্বার ভেরিফাইড।")} ({profile.mobile})</p>
            </div>

            <div className="verify-card">
              <div className="verify-header">
                <h3>{t("Level 2: Email Verification", "লেভেল ২: ইমেইল ভেরিফিকেশন")}</h3>
                {profile.email_verified && <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              {!profile.email_verified ? (
                <form onSubmit={handleSaveEmail} className="verify-form">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Enter your email", "ইমেইল দিন")} required />
                  <button type="submit">{t("Verify Email", "ভেরিফাই করুন")}</button>
                </form>
              ) : (
                <p className="verify-desc text-green"><svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {profile.email}</p>
              )}
            </div>

            <div className="verify-card">
              <div className="verify-header">
                <h3>{t("Level 3: Address Verification", "লেভেল ৩: ঠিকানা ভেরিফিকেশন")}</h3>
                {profile.address_verified && <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              {!profile.address_verified ? (
                <form onSubmit={handleSaveAddress} className="verify-form">
                  <input type="text" value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder={t("Birthday (YYYY-MM-DD)", "জন্মদিন (YYYY-MM-DD)")} required />
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t("Postal Code", "পোস্টাল কোড")} required />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("City", "শহর")} required />
                  <button type="submit">{t("Verify Address", "ঠিকানা ভেরিফাই করুন")}</button>
                </form>
              ) : (
                <p className="verify-desc text-green"><svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {t("Address Verified", "ঠিকানা ভেরিফাইড")}</p>
              )}
            </div>

            <div className="verify-card opacity-70">
              <div className="verify-header">
                <h3>{t("Level 4: Identify Verification", "লেভেল ৪: আইডি ভেরিফিকেশন")}</h3>
                {profile.identify_verified && <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <p className="verify-desc">{t("Coming soon (NID / Passport upload).", "শীঘ্রই আসছে (NID / পাসপোর্ট আপলোড)।")}</p>
            </div>
          </div>
        )}

        {/* --- Security Tab --- */}
        {activeTab === "security" && (
          <div className="settings-card">
            <form onSubmit={handlePasswordChange} className="settings-form">
              <label>{t("New Password", "নতুন পাসওয়ার্ড")}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              
              <label>{t("Confirm New Password", "পাসওয়ার্ড নিশ্চিত করুন")}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              
              <button type="submit">{t("Update Password", "পাসওয়ার্ড আপডেট করুন")}</button>
            </form>
          </div>
        )}

        {/* --- Sessions Tab --- */}
        {activeTab === "sessions" && (
          <div className="settings-card">
            <p className="verify-desc mb-4">{t("Your recent login sessions.", "আপনার সাম্প্রতিক লগইন সেশনগুলো।")}</p>
            <div className="session-list">
              <div className="text-center py-6 text-[#A0AAB2] text-sm border border-dashed border-[#2B4236] rounded-lg">
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
