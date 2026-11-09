"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./profile.css";

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
        
        {/* =========================================
            এক্সক্লুসিভ প্রোফাইল অ্যাক্টিভেশন কার্ড
            ========================================= */}
        <div className="activation-card-wrapper">
          <div className="activation-card">
            <div className="card-glow"></div>
            
            {/* কার্ডের উপরের অংশ */}
            <div className="activation-header">
              <div className="activation-logo">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="activation-title">
                <h2>{t("PROFILE ACTIVATION", "প্রোফাইল অ্যাক্টিভেশন")}</h2>
                <span>Official Member Card</span>
              </div>
              <div className="hologram-chip">
                <div className="chip-line"></div>
                <div className="chip-line"></div>
                <div className="chip-line"></div>
              </div>
            </div>

            {/* কার্ডের মাঝের অংশ */}
            <div className="activation-body">
              <div className="user-info">
                <span className="label">{t("USER ID", "ইউজার আইডি")}</span>
                <strong className="value">{profile?.game_id || "N/A"}</strong>
              </div>

              <div className="status-info">
                <span className="label">{t("LEVEL", "লেভেল")}</span>
                <strong className="value level-value">
                  {t("Gold III", "গোল্ড ৩")}
                </strong>
              </div>
            </div>

            {/* কার্ডের নিচের অংশ (পাশাপাশি অ্যালাইন করা) */}
            <div className="activation-footer">
              <div className="status-badge">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile?.account_status === "active" ? t("VERIFIED & ACTIVE", "ভেরিফাইড ও অ্যাক্টিভ") : t("PENDING", "পেন্ডিং")}
              </div>
              
              <div className="join-date">
                {t("Member Since", "সদস্য হয়েছেন")}: {new Date(profile?.created_at).toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
