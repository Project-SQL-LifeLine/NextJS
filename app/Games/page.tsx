"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client"; // আপনার পাথ চেক করে নিন
import GameCard from "../../components/GameCard";
import "./games.css";

export default function GameHubPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = (en: string, bn: string) => en;

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // ডাটাবেস থেকে শুধু Game Hub এর জন্য সিলেক্ট করা গেমগুলো আনা
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

  // ক্যাটাগরি অনুযায়ী গ্রুপ করা (Originals, Slots, Ludo)
  const groupedGames = games.reduce((acc: any, game) => {
    const group = game.category_group || "Other Games";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="games-loading">
        <div className="spinner"></div>
        <p>{t("Loading Games...", "গেম লোড হচ্ছে...")}</p>
      </div>
    );
  }

  return (
    <div className="game-hub-wrapper">
      <div className="game-hub-container">
        
        <header className="game-hub-header">
          <h1>{t("Game Hub", "গেম হাব")}</h1>
          <p>{t("Select your favorite game and start playing.", "আপনার প্রিয় গেম চয়ন করুন এবং খেলা শুরু করুন।")}</p>
        </header>

        {Object.keys(groupedGames).length === 0 ? (
          <div className="no-games">
            {t("No games available right now.", "এই মুহূর্তে কোন গেম উপলব্ধ নেই।")}
          </div>
        ) : (
          Object.entries(groupedGames).map(([categoryName, categoryGames]: [string, any]) => (
            <section key={categoryName} className="game-category-section">
              <h2 className="category-title">{categoryName}</h2>
              <div className="games-grid">
                {categoryGames.map((game: any) => (
                  <GameCard 
                    key={game.id} 
                    title={game.title} 
                    image_path={game.image_path} 
                    link_url={game.link_url} 
                  />
                ))}
              </div>
            </section>
          ))
        )}

      </div>
    </div>
  );
}
