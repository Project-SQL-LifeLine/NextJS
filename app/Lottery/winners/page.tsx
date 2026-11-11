"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer";
import "./winners.css";

export default function WinnersPage() {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null); // কপি স্টেট

  // গেম আইডি মাস্ক করার ফাংশন (যেমন: RA****99)
  const maskGameId = (gameId: string) => {
    if (!gameId) return "Unknown";
    const id = gameId.toUpperCase();
    if (id.length <= 4) return id;
    return `${id.slice(0, 2)}****${id.slice(-2)}`;
  };

  // কপি করার ফাংশন
  const handleCopy = (text: string, id: string) => {
    if (!text || text === "N/A") return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d241e] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F5B041] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="winners-page">
      <LotteryHeader userProfile={profile} />

      <main className="winners-main">
        <h1 className="winners-title">
          <svg className="w-5 h-5 text-[#F5B041]" fill="currentColor" viewBox="0 0 20 20">
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
              // QR কোডের জন্য ডাটা
              const qrData = `Verify Winner: Track ID: ${winner.profiles?.lottery_track_id || 'N/A'}, Ticket: ${winner.winning_ticket_number || 'N/A'}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}&color=0d241e&bgcolor=ffffff`;

              return (
                <div key={winner.id} className="winner-card">
                  
                  {/* বাম দিকের তথ্য */}
                  <div className="winner-left">
                    <div className="flex items-center gap-2">
                      <span className="winner-id">ID: {maskGameId(winner.profiles?.game_id)}</span>
                      <span className="winner-badge">VERIFIED</span>
                    </div>
                    
                    <span className="winner-date">
                      {new Date(winner.draw_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    
                    <div className="winner-details-box">
                      <span className="detail-label">Ticket ID:</span>
                      <span className="detail-value">{winner.winning_ticket_number || "N/A"}</span>
                    </div>
                    
                    {/* Seed ID এবং কপি বাটন */}
                    <div className="winner-details-box relative">
                      <span className="detail-label">Seed ID:</span>
                      <span className="detail-value text-xs truncate max-w-[100px]">
                        {winner.profiles?.lottery_track_id || "N/A"}
                      </span>
                      {winner.profiles?.lottery_track_id && (
                        <button 
                          onClick={() => handleCopy(winner.profiles.lottery_track_id, winner.id)}
                          className="ml-2 text-[#A0ADB0] hover:text-[#F5B041] transition-colors"
                          title="Copy Seed ID"
                        >
                          {copiedId === winner.id ? (
                            <span className="text-[9px] text-[#00E701] font-bold">Copied!</span>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ডান দিকের প্রাইজ ও QR কোড */}
                  <div className="winner-right">
                    <span className="winner-prize">৳ {Number(winner.prize_amount).toLocaleString()}</span>
                    <span className="winner-tier">Tier: ৳{winner.winning_ticket_price}</span>
                    
                    <div className="qr-code-box">
                      <img src={qrUrl} alt="Verify QR" />
                      <span className="text-[7px] text-[#A0ADB0] text-center mt-1">SCAN TO VERIFY</span>
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
  );
}
