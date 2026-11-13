
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GameCard from "./GameCard";
import "./GameGrid.css";

interface Game {
  id: string;
  title: string;
  slug: string;
  image_path: string;
  link_url: string;
  category_group: string | null;
  theme_color: string | null;
  serial: number;
  is_active: boolean;
  is_game: boolean;
}

export default function GameGrid() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function fetchGames() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("home_categories_create")
        .select(
          "id, title, slug, image_path, link_url, category_group, theme_color, serial, is_active, is_game"
        )
        .eq("is_active", true)
        .eq("is_game", true)
        .order("serial", { ascending: true });

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setGames([]);
      } else {
        setGames((data || []) as Game[]);
      }

      setLoading(false);
    }

    fetchGames();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        games
          .map((game) => game.category_group)
          .filter((category): category is string =>
            Boolean(category?.trim())
          )
      )
    );
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        game.category_group === selectedCategory;

      const matchesSearch = game.title
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [games, selectedCategory, search]);

  return (
    <section className="shuffle-grid-section">

      <div className="shuffle-search-row">
        <input
          type="search"
          placeholder="Search games"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="shuffle-search-input"
        />
      </div>

      <div className="shuffle-category-row">

        <button
          className={
            selectedCategory === "ALL"
              ? "shuffle-category active"
              : "shuffle-category"
          }
          onClick={() => setSelectedCategory("ALL")}
        >
          All games
        </button>

        {categories.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category
                ? "shuffle-category active"
                : "shuffle-category"
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}

      </div>

      {loading ? (
        <div className="shuffle-grid-message">
          Loading games...
        </div>
      ) : error ? (
        <div className="shuffle-grid-message shuffle-error">
          Failed to load games: {error}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="shuffle-grid-message">
          No games found
        </div>
      ) : (
        <div className="shuffle-game-grid">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              image_path={game.image_path || ""}
              link_url={game.link_url || "#"}
              category_group={game.category_group || "CASINO"}
              theme_color={game.theme_color || "#22c55e"}
            />
          ))}
        </div>
      )}

    </section>
  );
}
