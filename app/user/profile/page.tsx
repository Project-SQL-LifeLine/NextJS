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

        /* নতুন প্রিমিয়াম প্রোফাইল কার্ড ডিজাইন */
        .profile-header-card-new {
          position: relative;
          border-radius: 20px;
          padding: 30px 20px;
          margin-bottom: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          /* প্রিমিয়াম ডার্ক পার্পল/নেভি গ্রেডিয়েন্ট */
          background: linear-gradient(135deg, #1f1b33 0%, #121016 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        
        /* পেছনের গ্লো ইফেক্ট */
        .profile-header-card-new::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(107, 76, 255, 0.15) 0%, transparent 60%);
          z-index: 0;
        }

        /* ডিফল্ট অ্যাভাটার আইকন (গ্লাস ইফেক্ট) */
        .profile-avatar-new {
          position: relative;
          z-index: 1;
          width: 90px;
          height: 90px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
        }
        
        .profile-avatar-new svg {
          width: 45px;
          height: 45px;
          color: rgba(255, 255, 255, 0.8);
        }

        .profile-name-new {
          position: relative;
          z-index: 1;
          margin: 0 0 8px 0;
          color: #FFFFFF;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        /* VIP/Silver ব্যাজ স্টাইল */
        .profile-badge-new {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px 14px;
          border-radius: 20px;
          color: #E2E8F0;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .profile-badge-new svg {
          width: 14px;
          height: 14px;
          color: #A0AAB2;
        }

        .profile-join-date-new {
          position: relative;
          z-index: 1;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          margin-bottom: 16px;
        }

        .profile-status-badge-new {
          position: relative;
          z-index: 1;
          padding: 5px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-active-new { background: rgba(0, 231, 1, 0.15); color: var(--color-primary); border: 1px solid rgba(0, 231, 1, 0.3); }
        .status-blocked-new { background: rgba(255, 77, 77, 0.15); color: var(--color-danger); border: 1px solid rgba(255, 77, 77, 0.3); }

        /* অন্যান্য কার্ড স্টাইল */
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
          
          {/* নতুন প্রিমিয়াম প্রোফাইল কার্ড */}
          <div className="profile-header-card-new">
            
            {/* ডিফল্ট ইউজার আইকন */}
            <div className="profile-avatar-new">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* ইউজার নেম */}
            <h2 className="profile-name-new">{profile?.game_id || "User"}</h2>
            
            {/* ভিআইপি / সিলভার ব্যাজ */}
            <div className="profile-badge-new">
              <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {t("Silver 3", "সিলভার ৩")}
            </div>

            {/* জয়েনিং ডেট */}
            <div className="profile-join-date-new">
              {t("Joined", "যোগদান")}: {new Date(profile?.created_at).toLocaleDateString('en-GB')}
            </div>

            {/* অ্যাকাউন্ট স্ট্যাটাস */}
            <span className={`profile-status-badge-new ${profile?.account_status === "active" ? "status-active-new" : "status-blocked-new"}`}>
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
    </>
  );
}
