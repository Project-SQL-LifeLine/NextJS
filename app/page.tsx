"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase/client";
import { useLanguage } from "../lib/LanguageContext";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const { t, language } = useLanguage();

  // স্লাইডার টেনে দেখার জন্য রেফারেন্স
  const sliderRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // অটো স্লাইডের জন্য টাইমার (৩ সেকেন্ড)
  useEffect(() => {
    if (banners.length > 1 && !isDragging) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [banners.length, isDragging]);

  // ড্র্যাগ ইভেন্ট (টাচ এবং মাউস)
  const handleStart = (x: number) => {
    setIsDragging(true);
    setStartX(x);
  };

  const handleEnd = (x: number) => {
    setIsDragging(false);
    const diff = startX - x;
    if (diff > 50) {
      // বামে টানা -> পরের ব্যানার
      setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    } else if (diff < -50) {
      // ডানে টানা -> আগের ব্যানার
      setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
  };

  const noticeText = language === "EN" 
    ? "Daily first deposit bonus 20%! ✨"
    : (banners.length > 0 && banners[0].notice_text 
        ? banners[0].notice_text 
        : "করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨");

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 relative overflow-hidden">
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 15s linear infinite;
        }
      `}</style>

      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      {/* স্ক্রলিং অ্যানাউন্সমেন্ট (ভাষা অনুযায়ী) */}
      <div className="px-3 mt-3">
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-full py-1.5 px-3 flex items-center justify-between overflow-hidden relative">
          <span className="flex items-center gap-1 text-white text-xs w-full overflow-hidden">
            <span>🔔</span> 
            <div className="flex-1 overflow-hidden relative h-4">
              <span className="animate-marquee text-white font-medium">
                {noticeText}
              </span>
            </div>
          </span>
          <span className="text-yellow-400 text-lg z-10 bg-[#1A2C38] pl-2">✉️</span>
        </div>
      </div>

      {/* ব্যানার স্লাইডার (Cross Fade এবং Drag Support) */}
      <div className="px-3 mt-3">
        <div 
          ref={sliderRef}
          className="bg-[#092238] border border-[#2F4553] rounded-xl overflow-hidden relative flex items-center justify-center w-full min-h-[100px] cursor-grab active:cursor-grabbing touch-pan-y"
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseUp={(e) => handleEnd(e.clientX)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        >
          {banners.length > 0 ? (
            <>
              {banners.map((banner, index) => (
                <a 
                  key={banner.id}
                  href={banner.redirect_url || "#"} 
                  className={`w-full transition-opacity duration-700 ease-in-out ${
                    index === currentBanner ? "opacity-100 z-10 relative block" : "opacity-0 z-0 absolute pointer-events-none hidden"
                  }`}
                >
                  <img 
                    src={banner.image_url} 
                    alt="Banner" 
                    className="w-full h-auto object-contain pointer-events-none" 
                  />
                </a>
              ))}
              
              {/* স্লাইডার ইন্ডিকেটর ডট */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentBanner ? "bg-yellow-400" : "bg-white/40"
                    }`} 
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-textSec text-sm">No banners available</div>
          )}
        </div>
      </div>

      {/* ক্যাটাগরি বাটন (Language অনুযায়ী) */}
      <div className="px-3 mt-6 grid grid-cols-4 gap-2">
        {[
          { key: "Hot", label: t("Hot", "হট"), icon: "🔥" },
          { key: "Slot", label: t("Slot", "স্লট"), icon: "🎰" },
          { key: "Live", label: t("Live", "লাইভ"), icon: "🎲" },
          { key: "Fishing", label: t("Fishing", "ফিশিং"), icon: "🎣" }
        ].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-[#1475E0]/10' : ''}`}>
            <span className="text-xl mb-1">{item.icon}</span>
            <span className={`text-xs font-semibold ${idx === 0 ? 'text-[#1475E0]' : 'text-[#B1BAD3]'}`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* গেম কার্ড */}
      <div className="px-3 mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((game) => (
          <div key={game} className="bg-[#1A2C38] rounded-md overflow-hidden relative aspect-square border border-[#2F4553]">
             <img src={`https://placehold.co/150x150/1A2C38/FFF?text=Game+${game}`} alt={`Game ${game}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* ফ্লোটিং বাটন */}
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
