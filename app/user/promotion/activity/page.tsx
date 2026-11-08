"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase/client"; // আপনার import পাথ অনুযায়ী অ্যাডজাস্ট করুন
import "./activity.css";

// ক্যাটাগরি লিস্ট
const CATEGORIES = [
  { id: "all", label: "সব" },
  { id: "deposit", label: "আমানত" },
  { id: "electronic", label: "ইলেকট্রনিক" },
  { id: "rebate", label: "রিবেট" },
  { id: "other", label: "অন্যান্য" },
];

export default function ActivityPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      // Supabase থেকে শুধুমাত্র is_active = true ডাটা আনছি
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching promotions:", error);
      } else if (data) {
        setPromotions(data);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ক্যাটাগরি অনুযায়ী ফিল্টার
  const filteredPromotions = activeCategory === "all"
    ? promotions
    : promotions.filter((promo) => promo.category === activeCategory);

  return (
    <div className="activity-page">
      {/* হেডার */}
      <div className="activity-header">
        <Link href="/user/promotion" style={{ color: "var(--gold-accent)", textDecoration: "none" }}>
          &#8592;
        </Link>
        <span style={{ flex: 1 }}>প্রমোশন</span>
      </div>

      {/* ফিল্টার বার */}
      <div className="filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`filter-btn ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* প্রমোশন লিস্ট */}
      <div className="promo-list">
        {loading ? (
          <div className="loading-state">প্রমোশন লোড হচ্ছে...</div>
        ) : filteredPromotions.length === 0 ? (
          <div className="empty-state">এই ক্যাটাগরিতে কোনো প্রমোশন নেই।</div>
        ) : (
          filteredPromotions.map((promo) => (
            <div key={promo.id} className="promo-card">
              {/* ব্যানার ইমেজ */}
              <div className="promo-image-container">
                <img 
                  src={promo.image_url} 
                  alt={promo.title} 
                  className="promo-image"
                  onError={(e) => {
                    // ইমেজ লোড না হলে একটি ডিফল্ট ইমেজ দেখাবে
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x300/1E2D4A/D4AF37?text=Dada8+Promotion";
                  }}
                />
              </div>
              
              {/* টেক্সট ও বাটন */}
              <div className="promo-content">
                <div className="promo-text-area">
                  <div className="promo-title">{promo.title}</div>
                  <div className="promo-date">{promo.valid_until || "দীর্ঘমেয়াদি"}</div>
                </div>
                <Link href={promo.button_link || "#"}>
                  <button className="promo-btn">
                    সব দেখুন
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
