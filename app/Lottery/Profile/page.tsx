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
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // মডাল স্টেট
  const [activeModal, setActiveModal] = useState<"pin" | "password" | "trick" | null>(null);
  const [oldInputValue, setOldInputValue] = useState(""); 
  const [inputValue, setInputValue] = useState(""); 
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // একাউন্ট নাম্বার দেখার স্টেট
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
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

  // ==========================================
  // ১. পেজ লোড এবং অটো-রিফ্রেশ লজিক
  // ==========================================
  useEffect(() => {
    fetchProfile();

    // ইউজার যখন অন্য ট্যাব বা অ্যাপে গিয়ে আবার ফিরে আসবে, তখন ডাটা রিফ্রেশ হবে
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProfile();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchProfile);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchProfile);
    };
  }, []);

  // ==========================================
  // ২. Real-time আপডেট (যদি অ্যাডমিন সাথে সাথে ব্যালেন্স আপডেট করে)
  // ==========================================
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          // যখনই ডাটাবেসে lottery_balance আপডেট হবে, সাথে সাথে UI-তে দেখাবে
          setProfile((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id]);


  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    setModalMessage({ type: "", text: "" });

    try {
      // ১. পিন পরিবর্তন লজিক
      if (activeModal === "pin") {
        if (inputValue.length !== 4 || isNaN(Number(inputValue))) {
          throw new Error("New PIN must be exactly 4 digits.");
        }
        if (profile?.lottery_secret_pin && oldInputValue !== profile.lottery_secret_pin) {
          throw new Error("Incorrect old PIN.");
        }
        const { error } = await supabase.from("profiles").update({ lottery_secret_pin: inputValue }).eq("id", profile.id);
        if (error) throw error;
        
        setModalMessage({ type: "success", text: "PIN updated successfully!" });
        fetchProfile();
        setTimeout(() => closeModal(), 1500);

      } 
      // ২. পাসওয়ার্ড পরিবর্তন লজিক
      else if (activeModal === "password") {
        if (inputValue.length < 6) {
          throw new Error("New Password must be at least 6 characters.");
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: oldInputValue,
        });
        if (signInError) throw new Error("Incorrect old password.");

        const { error: updateError } = await supabase.auth.updateUser({ password: inputValue });
        if (updateError) throw updateError;
        
        setModalMessage({ type: "success", text: "Password changed successfully!" });
        setTimeout(() => closeModal(), 1500);

      } 
      // ৩. ট্রিক সাবমিট
      else if (activeModal === "trick") {
        if (!inputValue.trim()) throw new Error("Please write your trick.");
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
    setOldInputValue("");
    setInputValue("");
    setModalMessage({ type: "", text: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center">
        <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  
  let displayAccNum = "**** **** **** ****";
  if (profile?.lottery_account_number) {
    if (showAccountNumber) {
      displayAccNum = profile.lottery_account_number.match(/.{1,4}/g)?.join(" ") || profile.lottery_account_number;
    } else {
      displayAccNum = `${profile.lottery_account_number.slice(0, 2)}**********${profile.lottery_account_number.slice(-2)}`;
    }
  }

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
            <h3 className="v-card-balance">৳ {balance}</h3>
          </div>

          <div className="v-card-footer">
            <div className="v-card-footer-left">
              <div className="v-acc-row">
                <p className="v-card-acc-number">{displayAccNum}</p>
                <button className="eye-btn" onClick={() => setShowAccountNumber(!showAccountNumber)}>
                  {showAccountNumber ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="v-card-name">{accountName}</p>
            </div>
            <div>
              <p className="v-card-date">Since: {creationDate}</p>
            </div>
          </div>

          <div className="v-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
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

      {/* Full Screen Modals */}
      {activeModal && (
        <div className="fullscreen-modal">
          <div className="modal-header">
            <button onClick={closeModal} className="modal-back-btn">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="modal-header-title">
              {activeModal === "pin" && (profile?.lottery_secret_pin ? "Change Secret PIN" : "Set Secret PIN")}
              {activeModal === "password" && "Change Password"}
              {activeModal === "trick" && "Submit Trick"}
            </h3>
          </div>

          <div className="modal-body">
            
            {activeModal === "pin" && (
              <>
                {profile?.lottery_secret_pin && (
                  <div className="form-group">
                    <label className="form-label">Old 4-Digit PIN</label>
                    <input 
                      type="password"
                      className="modal-input"
                      placeholder="Enter old PIN"
                      value={oldInputValue}
                      onChange={(e) => setOldInputValue(e.target.value)}
                      maxLength={4}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">New 4-Digit PIN</label>
                  <input 
                    type="password"
                    className="modal-input"
                    placeholder="Enter new PIN"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </>
            )}

            {activeModal === "password" && (
              <>
                <div className="form-group">
                  <label className="form-label">Old Password</label>
                  <input 
                    type="password"
                    className="modal-input"
                    placeholder="Enter old password"
                    value={oldInputValue}
                    onChange={(e) => setOldInputValue(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password"
                    className="modal-input"
                    placeholder="Enter new password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
              </>
            )}

            {activeModal === "trick" && (
              <div className="form-group">
                <label className="form-label">Your Trick</label>
                <textarea 
                  className="modal-input modal-textarea"
                  placeholder="Write your trick here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            {modalMessage.text && (
              <p className={`msg-text ${modalMessage.type === "error" ? "msg-error" : "msg-success"}`}>
                {modalMessage.text}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button onClick={handleModalSubmit} disabled={isSubmitting} className="btn-submit">
              {isSubmitting ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
