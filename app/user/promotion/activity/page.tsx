"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import { useLanguage } from "../../../../lib/LanguageContext";
import Header from "../../../../components/Header";
import BottomNav from "../../../../components/BottomNav";
import "./activity.css";

export default function ActivityPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // সেশন চেক এবং প্রোফাইল লোড
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) setProfile(profileData);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

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

  return (
    <div className="min-h-screen bg-[#18221E] pb-20 font-sans">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      {/* প্রমোশন লিস্ট (হেডারের ঠিক নিচে) */}
      <div className="p-4 flex flex-col gap-4 mt-2">
        {loading ? (
          <div className="text-center text-[#A0ADB0] text-sm py-10">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center text-[#A0ADB0] text-sm py-10">No promotions available.</div>
        ) : (
          promotions.map((promo) => (
            <div key={promo.id} className="bg-[#1B2A23] border border-[#263C32] rounded-xl overflow-hidden shadow-lg">
              
              {/* প্রমোশন ইমেজ */}
              <div className="w-full h-40 relative">
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x300/1B2A23/00E701?text=Promotion";
                  }}
                />
              </div>

              {/* প্রমোশন কন্টেন্ট */}
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-[#FFFFFF] text-sm font-bold mb-1">{promo.title}</h3>
                  <p className="text-[#A0ADB0] text-[11px]">{promo.valid_until || "Long-term"}</p>
                </div>
                
                {/* ৩ডি গ্লসি বাটন */}
                <button
                  className="w-full py-2.5 rounded-lg font-bold text-[12px] text-white transition-all active:translate-y-[2px]"
                  style={{
                    background: "linear-gradient(180deg, #34f05f 0%, #1a9e4c 100%)",
                    border: "1px solid #117934",
                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 0 #117934, 0 6px 10px rgba(0,0,0,0.3)",
                  }}
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

      <BottomNav />
    </div>
  );
}
