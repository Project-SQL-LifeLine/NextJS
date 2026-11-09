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
    <div className="min-h-screen bg-[#0d241e] pb-20 font-sans">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      {/* প্রমোশন লিস্ট (হেডারের ঠিক নিচে) */}
      <div className="p-4 flex flex-col gap-4 mt-2">
        {loading ? (
          <div className="text-center text-[#A0ADB0] text-[11px] py-10">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center text-[#A0ADB0] text-[11px] py-10">No promotions available.</div>
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
                  <h3 className="text-[#FFFFFF] text-[11px] font-bold mb-1">{promo.title}</h3>
                  <p className="text-[#A0ADB0] text-[11px]">{promo.valid_until || "Long-term"}</p>
                </div>
                
                {/* সেটিংস পেজের হুবহু বাটন ডিজাইন */}
                <button
                  className="w-full py-3 rounded-lg font-bold text-[11px] text-white transition-all active:translate-y-[1px]"
                  style={{
                    background: "#184f35", /* সলিড সবুজ */
                    border: "1px solid #FFFFFF", /* সাদা বর্ডার */
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)", /* শ্যাডো */
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
