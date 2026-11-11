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
        // ১. প্রোফাইল লোড
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileData) setProfile(profileData);
        }

        // ২. বিজয়ীদের তালিকা লোড (ticket_draws + profiles)
        const { data: drawsData, error } = await supabase
          .from("ticket_draws")
          .select(`
            id,
            draw_date,
            prize_amount,
            winning_ticket_price,
            profiles:winner_user_id (game_id)
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
            {winners.map((winner) => (
              <div key={winner.id} className="winner-card">
                <div className="winner-left">
                  <span className="winner-id">ID: {maskGameId(winner.profiles?.game_id)}</span>
                  <span className="winner-date">
                    {new Date(winner.draw_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="winner-tier">
                    {t("Ticket Tier", "টিকিট টিয়ার")}: ৳ {winner.winning_ticket_price}
                  </span>
                </div>
                <div className="winner-right">
                  <span className="winner-prize">৳ {Number(winner.prize_amount).toLocaleString()}</span>
                  <span className="winner-badge">VERIFIED WINNER</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <LotteryFooter />
    </div>
  );
}
