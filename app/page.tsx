"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase/client";
import { useLanguage } from "../lib/LanguageContext";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (profile) setUserProfile(profile);
      } else {
        setIsLoggedIn(false);
      }
    };

    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_active", true)
        .order("serial", { ascending: true });

      if (!error && data && data.length > 0) {
        setBanners(data);
      }
    };

    checkSession();
    fetchBanners();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ব্যানার স্লাইডারের জন্য টাইমার
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 relative overflow-hidden">
      
      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      <div className="px-3 mt-3">
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-full py-1.5 px-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-white"><span>🔔</span> করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨</span>
          <span className="text-yellow-400 text-lg">✉️</span>
        </div>
      </div>

      {/* ব্যানার স্লাইডার (বর্ডার পর্যন্ত ফিট করা হয়েছে) */}
      <div className="px-3 mt-3">
        <div className="bg-[#092238] border border-[#2F4553] rounded-lg overflow-hidden h-40 flex items-center justify-center relative">
          {banners.length > 0 ? (
            <a href={banners[currentBanner].redirect_url || "#"} className="w-full h-full relative block">
              <img 
                src={banners[currentBanner].image_url} 
                alt="Banner" 
                className="w-full h-full object-cover" 
              />
              {/* স্লাইডার ডট ইন্ডিকেটর */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {banners.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentBanner ? "bg-yellow-400" : "bg-white/50"}`} />
                ))}
              </div>
            </a>
          ) : (
            <div className="text-textSec text-sm">No banners available</div>
          )}
        </div>
      </div>

      {/* জ্যাকপট এবং অ্যাকশন বাটন সরিয়ে ফেলা হয়েছে */}

      <div className="px-3 mt-6 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-[#1475E0]/10' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className={`text-xs font-semibold ${idx === 0 ? 'text-[#1475E0]' : 'text-[#B1BAD3]'}`}>{item}</span>
          </div>
        ))}
      </div>

      <div className="px-3 mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((game) => (
          <div key={game} className="bg-[#1A2C38] rounded-md overflow-hidden relative aspect-square border border-[#2F4553]">
             <img src={`https://placehold.co/150x150/1A2C38/FFF?text=Game+${game}`} alt={`Game ${game}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="fixed right-3 bottom-24 flex flex-col gap-3 z-50">
        <button className="w-10 h-10 rounded-full bg-[#00E701] flex items-center justify-center text-black shadow-lg">✈️</button>
        <button className="w-10 h-10 rounded-full bg-[#00E701] flex items-center justify-center text-black shadow-lg">✈️</button>
        <button className="w-10 h-10 rounded-full bg-[#1A2C38] border border-[#2F4553] flex items-center justify-center text-white shadow-lg">f</button>
        <button className="w-10 h-10 rounded-full bg-[#1A2C38] border border-[#2F4553] flex items-center justify-center text-white shadow-lg">🎧</button>
      </div>

      <BottomNav />
    </div>
  );
}
