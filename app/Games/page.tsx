"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client"; // আপনার পাথ চেক করে নিন
import GameCard from "../../components/GameCard";
import "./games.css";

export default function GameHubPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All games");
  
  const t = (en: string, bn: string) => en;

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from("home_categories_create")
          .select("*")
          .eq("is_active", true)
          .eq("is_game", true)
          .contains("display_locations", ["game_hub"])
          .order("serial", { ascending: true });

        if (error) throw error;
        if (data) setGames(data);
      } catch (err) {
        console.error("Error fetching games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  // ক্যাটাগরি লিস্ট তৈরি করা (All games + Unique Categories)
  const categories = ["All games", ...Array.from(new Set(games.map(g => g.category_group || "General")))];

  // সিলেক্ট করা ক্যাটাগরি অনুযায়ী গেম ফিল্টার করা
  const filteredGames = activeTab === "All games" 
    ? games 
    : games.filter(g => (g.category_group || "General") === activeTab);

  if (loading) {
    return (
      <div className="game-hub-loading">
        <div className="spinner"></div>
        <p>{t("Loading Games...", "গেম লোড হচ্ছে...")}</p>
      </div>
    );
  }

  return (
    <div className="game-hub-wrapper">
      <div className="game-hub-container">
        
        {/* হেডার */}
        <header className="game-hub-header">
          <h1>{t("Game Hub", "গেম হাব")}</h1>
          <p>{t("Select your favorite game and start playing.", "আপনার প্রিয় গেম চয়ন করুন এবং খেলা শুরু করুন।")}</p>
        </header>

        {/* ক্যাটাগরি ট্যাব (পাশাপাশি স্ক্রল হবে) */}
        <div className="category-tabs-container">
          {categories.map((catName) => (
            <button 
              key={catName}
              className={`category-tab ${activeTab === catName ? 'active' : ''}`}
              onClick={() => setActiveTab(catName)}
            >
              {/* ক্যাটাগরি নাম */}
              {catName}
            </button>
          ))}
        </div>

        {/* গেম গ্রিড (মোবাইলে ৩টি কলাম) */}
        {filteredGames.length === 0 ? (
          <div className="no-games">
            {t("No games available right now.", "এই মুহূর্তে কোন গেম উপলব্ধ নেই।")}
          </div>
        ) : (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard 
                key={game.id} 
                title={game.title} 
                image_path={game.image_path} 
                link_url={game.link_url} 
                category_group={game.category_group} 
                theme_color={game.theme_color} /* 🚨 এখানে কালার পাস হচ্ছে */
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
