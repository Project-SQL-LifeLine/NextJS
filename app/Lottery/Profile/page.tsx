"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer";
import "./profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // মডাল স্টেট
  const [activeModal, setActiveModal] = useState<"pin" | "password" | "trick" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id, game_id, lottery_balance, created_at, lottery_account_number, lottery_secret_pin")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // হ্যান্ডেল সাবমিট (পিন, পাসওয়ার্ড, ট্রিক)
  const handleModalSubmit = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    setModalMessage({ type: "", text: "" });

    try {
      if (activeModal === "pin") {
        if (inputValue.length !== 4 || isNaN(Number(inputValue))) {
          throw new Error("PIN must be exactly 4 digits.");
        }
        const { error } = await supabase.from("profiles").update({ lottery_secret_pin: inputValue }).eq("id", profile.id);
        if (error) throw error;
        setModalMessage({ type: "success", text: "PIN updated successfully!" });
        fetchProfile();
        setTimeout(() => closeModal(), 1500);

      } else if (activeModal === "password") {
        if (inputValue.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const { error } = await supabase.auth.updateUser({ password: inputValue });
        if (error) throw error;
        setModalMessage({ type: "success", text: "Password changed successfully!" });
        setTimeout(() => closeModal(), 1500);

      } else if (activeModal === "trick") {
        const { error } = await supabase.from("trick_submissions").insert({
          user_id: profile.id,
          trick_content: inputValue
        });
        if (error) throw error;
        setModalMessage({ type: "success", text: "Trick submitted successfully!" });
        setTimeout(() => closeModal(), 1500);
      }
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setInputValue("");
    setModalMessage({ type: "", text: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05100b] flex flex-col items-center justify-center">
        <svg className="w-10 h-10 text-[#00ffaa] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">LOADING WALLET...</p>
      </div>
    );
  }

  const balance = Number(profile?.lottery_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const accountName = profile?.game_id || "User";
  const creationDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : "N/A";
  
  // অ্যাকাউন্ট নাম্বার ফরম্যাট করা (৪ ডিজিট পর পর স্পেস)
  const formattedAccNum = profile?.lottery_account_number 
    ? profile.lottery_account_number.match(/.{1,4}/g)?.join(" ") 
    : "0000 0000 0000 0000";

  return (
    <div className="profile-wrapper">
      <LotteryHeader userProfile={profile} />

      <div className="profile-main">
        
        {/* ভার্চুয়াল কার্ড */}
        <div className="v-card">
          <div className="v-card-glow"></div>
          
          <div className="v-card-header">
            <h2 className="v-card-title">Account Holder Name</h2>
          </div>

          <div className="v-card-balance-section">
            <p className="v-card-balance-label">Lottery Balance</p>
            <h3 className="v-card-balance">৳ {balance}</h3>
          </div>

          <div className="v-card-footer">
            <div>
              <p className="v-card-acc-number">{formattedAccNum}</p>
              <p className="v-card-name">{accountName}</p>
            </div>
            <div>
              <p className="v-card-date">Since: {creationDate}</p>
            </div>
          </div>

          <div className="v-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#07130d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
          </div>
        </div>

        {/* অ্যাকশন কার্ড গ্রিড */}
        <div className="action-grid">
          {/* Set Pin */}
          <div className="action-card" onClick={() => setActiveModal("pin")}>
            <div className="action-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="action-text">{profile?.lottery_secret_pin ? "Change Pin" : "Set Pin"}</span>
          </div>

          {/* Change Password */}
          <div className="action-card" onClick={() => setActiveModal("password")}>
            <div className="action-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="action-text">Change Password</span>
          </div>

          {/* Trick Submit */}
          <div className="action-card" onClick={() => setActiveModal("trick")}>
            <div className="action-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="action-text">Trick Submit</span>
          </div>
        </div>

      </div>

      <LotteryFooter />

      {/* মডাল ওভারলে */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {activeModal === "pin" && (profile?.lottery_secret_pin ? "Change Secret PIN" : "Set Secret PIN")}
              {activeModal === "password" && "Change Password"}
              {activeModal === "trick" && "Submit Trick"}
            </h3>

            {activeModal === "trick" ? (
              <textarea 
                className="modal-input modal-textarea"
                placeholder="Write your trick here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            ) : (
              <input 
                type={activeModal === "pin" ? "number" : "password"}
                className="modal-input"
                placeholder={activeModal === "pin" ? "Enter 4-digit PIN" : "Enter new password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={activeModal === "pin" ? 4 : undefined}
              />
            )}

            {modalMessage.text && (
              <p className={`msg-text ${modalMessage.type === "error" ? "msg-error" : "msg-success"}`}>
                {modalMessage.text}
              </p>
            )}

            <div className="modal-buttons">
              <button onClick={closeModal} className="btn-cancel">Cancel</button>
              <button onClick={handleModalSubmit} disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
