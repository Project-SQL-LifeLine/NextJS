"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
// আপনার নির্দেশনা অনুযায়ী সঠিক ফুটার পাথ
import LotteryFooter from "../Footer/Footer";
import "./winners.css";

export default function WinnersPage() {
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // কন্ট্রোল লোডিং স্ক্রিন
  
  // কপি স্টেট (আইডি এবং টাইপ ট্র্যাক করার জন্য)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const maskGameId = (gameId: string) => {
    if (!gameId) return "Unknown";
    const id = gameId.toUpperCase();
    if (id.length <= 4) return id;
    return `${id.slice(0, 2)}****${id.slice(-2)}`;
  };

  const handleCopy = (text: string, key: string) => {
    if (!text || text === "N/A") return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(err => console.error("Failed to copy:", err));
  };

  useEffect(() => {
    // ৩.১ সেকেন্ড (৩১০০ মিলি সেকেন্ড) টাইমার
    const timer = new Promise((resolve) => setTimeout(resolve, 3100));

    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) setProfile(profileData);
        }

        const { data: drawsData, error } = await supabase
          .from("ticket_draws")
          .select(`
            id,
            draw_date,
            prize_amount,
            winning_ticket_price,
            winning_ticket_number,
            profiles:winner_user_id (game_id, lottery_track_id)
          `)
          .eq("status", "completed")
          .order("draw_date", { ascending: false });

        if (error) throw error;
        if (drawsData) setWinners(drawsData);
      } catch (err) {
        console.error("Error fetching winners:", err);
      }
    };

    // Promise.all ব্যবহার করে ডাটা ফেচ এবং ৩.১ সেকেন্ড টাইমার একসাথে রান করা হচ্ছে
    // যাতে ডাটা আগে লোড হলেও টাইমার শেষ হওয়ার আগে লোডার না সরে
    Promise.all([fetchData(), timer]).then(() => {
      setLoading(false);
    });

  }, []);

  // ==========================================
  // ৩.১ সেকেন্ডের সাদা লটারি SVG অ্যানিমেশন
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex flex-col items-center justify-center relative overflow-hidden">
        {/* ব্যাকগ্রাউন্ড সিম্বল (অ্যানিমেশন চলাকালীন) */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\'%3E%3Cpath d=\'M30 10l5 15h15l-12 9 5 15-13-9-13 9 5-15-12-9h15z\'/%3E%3C/g%3E%3C/svg%3E')] bg-repeat"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {/* সাদা লটারি টিকিট / ট্রফি SVG */}
          <div className="lottery-winner-loader">
            <svg 
              className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
            </svg>
          </div>
          <p className="text-white mt-6 font-bold tracking-widest animate-pulse text-[12px]">
            LOADING WINNERS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="winners-page">
      <div className="winners-overlay">
        <LotteryHeader userProfile={profile} />

        <main className="winners-main">
          <h1 className="winners-title">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            {t("Recent Winners", "সাম্প্রতিক বিজয়ী")}
          </h1>

          {winners.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{t("No winners yet. Check back after the next draw!", "এখনো কোনো বিজয়ী নেই। পরবর্তী ড্রয়ের পরে আবার দেখুন!")}</p>
            </div>
          ) : (
            <div className="winners-list">
              {winners.map((winner) => {
                const qrData = `Verify Winner: Track ID: ${winner.profiles?.lottery_track_id || 'N/A'}, Ticket: ${winner.winning_ticket_number || 'N/A'}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}&color=0d241e&bgcolor=ffffff`;

                return (
                  <div key={winner.id} className="winner-list-item">
                    
                    <div className="winner-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="winner-id">ID: {maskGameId(winner.profiles?.game_id)}</span>
                        <span className="winner-badge">VERIFIED</span>
                      </div>
                      
                      <span className="winner-date">
                        {new Date(winner.draw_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      
                      {/* টিকেট নাম্বার এবং কপি বাটন */}
                      <div className="winner-details-box">
                        <span className="detail-label">Ticket:</span>
                        <span className="detail-value">{winner.winning_ticket_number || "N/A"}</span>
                        {winner.winning_ticket_number && (
                          <button 
                            onClick={() => handleCopy(winner.winning_ticket_number, winner.id + '-ticket')}
                            className="copy-btn"
                            title="Copy Ticket ID"
                          >
                            {copiedKey === winner.id + '-ticket' ? (
                              <span className="text-white text-[9px] font-bold">Copied!</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Verify ID এবং কপি বাটন */}
                      <div className="winner-details-box">
                        <span className="detail-label">Verify ID:</span>
                        <span className="detail-value">
                          {winner.profiles?.lottery_track_id || "N/A"}
                        </span>
                        {winner.profiles?.lottery_track_id && (
                          <button 
                            onClick={() => handleCopy(winner.profiles.lottery_track_id, winner.id + '-verify')}
                            className="copy-btn"
                            title="Copy Verify ID"
                          >
                            {copiedKey === winner.id + '-verify' ? (
                              <span className="text-white text-[9px] font-bold">Copied!</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="winner-right">
                      <span className="winner-prize">৳ {Number(winner.prize_amount).toLocaleString()}</span>
                      <span className="winner-tier">Tier: ৳{winner.winning_ticket_price}</span>
                      
                      <div className="qr-code-box">
                        <img src={qrUrl} alt="Verify QR" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>

        <LotteryFooter />
      </div>
    </div>
  );
}
