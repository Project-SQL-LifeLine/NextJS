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

  // গেম আইডি মাস্ক করার ফাংশন (যেমন: RA****99)
  const maskGameId = (gameId: string) => {
    if (!gameId) return "Unknown";
    const id = gameId.toUpperCase();
    if (id.length <= 4) return id;
    return `${id.slice(0, 2)}****${id.slice(-2)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) setProfile(profileData);
        }

        // ডাটাবেস থেকে বিজয়ীদের তথ্য আনা (winning_ticket_number এবং lottery_track_id সহ)
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
              // QR কোডের জন্য ডাটা (ভেরিফিকেশনের জন্য)
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
                    
                    <div className="winner-details-box">
                      <span className="detail-label">Seed ID:</span>
                      <span className="detail-value text-xs truncate max-w-[120px]">{winner.profiles?.lottery_track_id || "N/A"}</span>
                    </div>
                  </div>

                  {/* ডান দিকের প্রাইজ ও QR কোড */}
                  <div className="winner-right">
                    <span className="winner-prize">৳ {Number(winner.prize_amount).toLocaleString()}</span>
                    <span className="winner-tier">Tier: ৳{winner.winning_ticket_price}</span>
                    
                    {/* QR Code */}
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
