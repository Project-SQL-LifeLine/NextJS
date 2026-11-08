"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";

export default function MyProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

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
    <>
      <style>{`
        .my-profile-page {
          --bg-primary: #18221E;
          --bg-card: #1B2A23;
          --bg-input: #111815;
          --border-color: #2B4236;
          --text-primary: #FFFFFF;
          --text-secondary: #A0AAB2;
          --color-primary: #00E701;
          --color-danger: #ff4d4d;
          background-color: var(--bg-primary);
          min-height: 100vh;
          width: 100%;
          font-family: inherit;
        }
        .my-profile-main {
          padding: 1rem 0.8rem 100px;
          max-width: 600px;
          margin: 0 auto;
        }
        .profile-header-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 16px;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          background: var(--bg-input);
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          color: var(--color-primary);
          margin-bottom: 12px;
        }
        .profile-header-card h2 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
          font-size: 1.4rem;
        }
        .profile-game-id {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 10px;
        }
        .profile-join-date {
          color: var(--text-secondary);
          font-size: 0.75rem;
          margin-bottom: 12px;
          background: var(--bg-input);
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .profile-status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-active { background: rgba(0, 231, 1, 0.1); color: var(--color-primary); border: 1px solid rgba(0, 231, 1, 0.3); }
        .status-blocked { background: rgba(255, 77, 77, 0.1); color: var(--color-danger); border: 1px solid rgba(255, 77, 77, 0.3); }
        .profile-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .profile-section-card h3 {
          color: var(--text-primary);
          font-size: 1.05rem;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-section-card h3 svg {
          color: var(--color-primary);
          width: 20px;
          height: 20px;
        }
        .profile-info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }
        .profile-info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .profile-info-row span {
          color: var(--text-secondary);
        }
        .profile-info-row strong {
          color: var(--text-primary);
          text-align: right;
          max-width: 60%;
          word-break: break-all;
        }
        .verify-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: bold;
        }
        .verify-yes { background: rgba(0, 231, 1, 0.15); color: var(--color-primary); }
        .verify-no { background: rgba(255, 77, 77, 0.15); color: var(--color-danger); }
      `}</style>

      <div className="my-profile-page pb-20">
        <Header isLoggedIn={isLoggedIn} userProfile={profile} />

        <main className="my-profile-main">
          
          {/* প্রোফাইল হেডার */}
          <div className="profile-header-card">
            <div className="profile-avatar">
              {profile?.game_id ? profile.game_id.charAt(0).toUpperCase() : "U"}
            </div>
            <h2>{profile?.full_name || t("No Name", "নাম নেই")}</h2>
            <p className="profile-game-id">@{profile?.game_id || "N/A"}</p>
            
            {/* Join Date যোগ করা হয়েছে */}
            <div className="profile-join-date">
              {t("Joined", "যোগদান")}: {new Date(profile?.created_at).toLocaleDateString('en-GB')}
            </div>

            <span className={`profile-status-badge ${profile?.account_status === "active" ? "status-active" : "status-blocked"}`}>
              {profile?.account_status === "active" ? t("Active", "সক্রিয়") : t("Blocked", "ব্লকড")}
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
    </>
  );
}
