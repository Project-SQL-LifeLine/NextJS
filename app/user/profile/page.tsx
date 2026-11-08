"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./profile.css"; // CSS ইমপোর্ট করা হলো

export default function MyProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/user/login");
        return;
      }

      setIsLoggedIn(true);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="my-profile-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2B4236] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="my-profile-page pb-20">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="my-profile-main">
        
        {/* প্রোফাইল হেডার */}
        <div className="profile-header-card">
          
          {/* ডিফল্ট ইউজার আইকন */}
          <div className="profile-avatar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* ইউজার নেম */}
          <h2>{profile?.game_id || "User"}</h2>
          
          {/* ভিআইপি / সিলভার ব্যাজ */}
          <div className="profile-badge">
            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            {t("Silver 3", "সিলভার ৩")}
          </div>

          {/* জয়েনিং ডেট */}
          <div className="profile-join-date">
            {t("Joined", "যোগদান")}: {new Date(profile?.created_at).toLocaleDateString('en-GB')}
          </div>

          {/* অ্যাকাউন্ট স্ট্যাটাস */}
          <span className={`profile-status-badge ${profile?.account_status === "active" ? "status-active" : "status-blocked"}`}>
            {profile?.account_status === "active" ? t("ACTIVE", "সক্রিয়") : t("BLOCKED", "ব্লকড")}
          </span>
        </div>

        {/* টার্নওভার ইনফো */}
        <div className="profile-section-card">
          <h3>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {t("Turnover Progress", "টার্নওভার প্রোগ্রেস")}
          </h3>
          <div className="profile-info-row">
            <span>{t("Required Turnover", "প্রয়োজনীয় টার্নওভার")}</span>
            <strong>৳ {Number(profile?.total_required_turnover || 0).toLocaleString()}</strong>
          </div>
          <div className="profile-info-row">
            <span>{t("Completed Turnover", "সম্পন্ন টার্নওভার")}</span>
            <strong className="text-[#00E701]">৳ {Number(profile?.total_completed_turnover || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* ব্যক্তিগত তথ্য */}
        <div className="profile-section-card">
          <h3>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {t("Personal Details", "ব্যক্তিগত তথ্য")}
          </h3>
          <div className="profile-info-row">
            <span>{t("Mobile", "মোবাইল")}</span>
            <strong>{profile?.mobile || "N/A"}</strong>
          </div>
          <div className="profile-info-row">
            <span>{t("Email", "ইমেইল")}</span>
            <strong>{profile?.email || "N/A"}</strong>
          </div>
          <div className="profile-info-row">
            <span>{t("Birthday", "জন্মদিন")}</span>
            <strong>{profile?.birthday || "N/A"}</strong>
          </div>
          <div className="profile-info-row">
            <span>{t("City", "শহর")}</span>
            <strong>{profile?.city || "N/A"}</strong>
          </div>
          <div className="profile-info-row">
            <span>{t("Postal Code", "পোস্টাল কোড")}</span>
            <strong>{profile?.postal_code || "N/A"}</strong>
          </div>
        </div>

        {/* ভেরিফিকেশন স্ট্যাটাস */}
        <div className="profile-section-card">
          <h3>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t("Verification Status", "ভেরিফিকেশন স্ট্যাটাস")}
          </h3>
          <div className="profile-info-row">
            <span>{t("Email Verified", "ইমেইল ভেরিফাইড")}</span>
            <span className={`verify-badge ${profile?.email_verified ? "verify-yes" : "verify-no"}`}>
              {profile?.email_verified ? t("Yes", "হ্যাঁ") : t("No", "না")}
            </span>
          </div>
          <div className="profile-info-row">
            <span>{t("Address Verified", "ঠিকানা ভেরিফাইড")}</span>
            <span className={`verify-badge ${profile?.address_verified ? "verify-yes" : "verify-no"}`}>
              {profile?.address_verified ? t("Yes", "হ্যাঁ") : t("No", "না")}
            </span>
          </div>
          <div className="profile-info-row">
            <span>{t("Identity Verified", "আইডি ভেরিফাইড")}</span>
            <span className={`verify-badge ${profile?.identify_verified ? "verify-yes" : "verify-no"}`}>
              {profile?.identify_verified ? t("Yes", "হ্যাঁ") : t("No", "না")}
            </span>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
