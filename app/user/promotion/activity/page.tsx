"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client"; // পাথ আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী অ্যাডজাস্ট করুন
import { useLanguage } from "../../../../lib/LanguageContext"; // পাথ অ্যাডজাস্ট করুন
import Header from "../../../../components/Header"; // পাথ অ্যাডজাস্ট করুন
import BottomNav from "../../../../components/BottomNav"; // পাথ অ্যাডজাস্ট করুন
import "./activity.css";

// ক্যাটাগরি লিস্ট (ইংরেজি)
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposit" },
  { id: "electronic", label: "Electronic" },
  { id: "rebate", label: "Rebate" },
  { id: "other", label: "Other" },
];

export default function ActivityPage() {
  const router = useRouter();
  const { t } = useLanguage(); // যদি আপনার LanguageContext-এ 't' ফাংশন থাকে
  
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
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
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const filteredPromotions =
    activeCategory === "all"
      ? promotions
      : promotions.filter((promo) => promo.category === activeCategory);

  return (
    <div className="activity-page">
      {/* আপনার প্রজেক্টের কমন Header */}
      <Header />

      {/* পেজের সাব-হেডার */}
      <div className="activity-header">
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--gold-accent)",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          &#8592;
        </button>
        <span style={{ flex: 1, textAlign: "center" }}>Promotion</span>
        <div style={{ width: "18px" }}></div> {/* ব্যালেন্স করার জন্য */}
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
          <div className="loading-state">Loading promotions...</div>
        ) : filteredPromotions.length === 0 ? (
          <div className="empty-state">No promotions available in this category.</div>
        ) : (
          filteredPromotions.map((promo) => (
            <div key={promo.id} className="promo-card">
              <div className="promo-image-container">
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  className="promo-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/600x300/1E2D4A/D4AF37?text=Promotion";
                  }}
                />
              </div>

              <div className="promo-content">
                <div className="promo-text-area">
                  <div className="promo-title">{promo.title}</div>
                  <div className="promo-date">{promo.valid_until || "Long-term"}</div>
                </div>
                <button
                  className="promo-btn"
                  onClick={() => {
                    if (promo.button_link) {
                      router.push(promo.button_link);
                    }
                  }}
                >
                  View All
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* আপনার প্রজেক্টের কমন BottomNav */}
      <BottomNav />
    </div>
  );
}
