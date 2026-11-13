"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import GameCard from "../components/GameCard";
import { supabase } from "../lib/supabase/client";
import { useLanguage } from "../lib/LanguageContext";

// ডাইনামিক SVG আইকন হেল্পার (ডিফল্ট আইকন)
const CategoryIcon = () => {
  return (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  
  // ক্যাটাগরি এবং গেম স্টেট
  const [categories, setCategories] = useState<string[]>([]); // 👈 এখন শুধু ক্যাটাগরির নাম থাকবে
  const [allHomeGames, setAllHomeGames] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); 
  const [filteredGames, setFilteredGames] = useState<any[]>([]); 
  
  const { t, language } = useLanguage();

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

    const fetchData = async () => {
      // ১. ব্যানার ফেচ
      const { data: bannerData } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_active", true)
        .order("serial", { ascending: true });
      if (bannerData) setBanners(bannerData);

      // ২. শুধুমাত্র গেমগুলো ফেচ করা হবে (is_game = true)
      const { data: gameData } = await supabase
        .from("home_categories_create")
        .select("*")
        .eq("is_active", true)
        .eq("is_game", true) 
        .contains("display_locations", ["home"]) 
        .order("serial", { ascending: true });

      if (gameData) {
        setAllHomeGames(gameData);

        // 🚀 গেমগুলোর category_group থেকে অটোমেটিক ইউনিক ক্যাটাগরি বের করা
        const uniqueCats = Array.from(new Set(gameData.map(g => g.category_group || "General")));
        setCategories(uniqueCats as string[]);

        // ডিফল্টভাবে প্রথম ক্যাটাগরিটি সিলেক্ট হবে
        if (uniqueCats.length > 0) {
          setSelectedCategory(uniqueCats[0] as string);
        }
      }
    };

    checkSession();
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setIsLoggedIn(true);
      else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ক্যাটাগরি সিলেক্ট করলে গেম ফিল্টার হওয়ার লজিক
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allHomeGames.filter(game => 
        (game.category_group || "General").toLowerCase() === selectedCategory.toLowerCase()
      );
      setFilteredGames(filtered);
    } else {
      setFilteredGames([]);
    }
  }, [selectedCategory, allHomeGames]);


  useEffect(() => {
    if (banners.length > 1 && !isDragging) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [banners.length, isDragging]);

  const handleStart = (x: number) => { setIsDragging(true); setStartX(x); };
  const handleEnd = (x: number) => {
    setIsDragging(false);
    const diff = startX - x;
    if (diff > 50) setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    else if (diff < -50) setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const noticeText = language === "EN" 
    ? "Daily first deposit bonus 20%! ✨"
    : (banners.length > 0 && banners[0].notice_text ? banners[0].notice_text : "করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨");

  return (
    <div className="min-h-screen bg-[#0d241e] pb-20 relative overflow-hidden">
      
      {/* গ্লোবাল স্টাইল (স্ক্রলবার হাইড করার জন্য) */}
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
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      {/* নোটিশ */}
      <div className="px-3 mt-3">
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-full py-1.5 px-3 flex items-center justify-between overflow-hidden relative">
          <span className="flex items-center gap-1 text-white text-xs w-full overflow-hidden">
            <span>🔔</span> 
            <div className="flex-1 overflow-hidden relative h-4">
              <span className="animate-marquee text-white font-medium">{noticeText}</span>
            </div>
          </span>
          <span className="text-yellow-400 text-lg z-10 bg-[#1A2C38] pl-2">✉️</span>
        </div>
      </div>

      {/* ব্যানার */}
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
                  <img src={banner.image_url} alt="Banner" className="w-full h-auto object-contain pointer-events-none" />
                </a>
              ))}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                {banners.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentBanner ? "bg-yellow-400" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-gray-400 text-sm">No banners available</div>
          )}
        </div>
      </div>

      {/* 🚀 অটোমেটিক ক্যাটাগরি বাটন (পাশাপাশি স্ক্রলিং) */}
      {categories.length > 0 && (
        <div className="px-3 mt-4 flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          {categories.map((catName, index) => {
            const isActive = selectedCategory === catName;
            return (
              <button 
                key={index}
                onClick={() => setSelectedCategory(catName)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 whitespace-nowrap transition-all border ${
                  isActive 
                  ? "bg-[#183f35] border-[#183f35] text-white shadow-lg" // আপনার কালার কোড
                  : "bg-[#1A2C38] border-[#2F4553] text-gray-400 hover:bg-[#253B49]"
                }`}
              >
                <CategoryIcon />
                <span className="text-xs font-semibold">{catName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 🚀 ফিল্টার করা গেম কার্ড গ্রিড (৩ কলাম) */}
      <div className="px-3 mt-4">
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                image_path={game.image_path}
                link_url={game.link_url}
                category_group={game.category_group}
                theme_color={game.theme_color}
                show_title={game.show_title}
                show_category_ribbon={game.show_category_ribbon}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm mt-10">
            No games available in this category.
          </div>
        )}
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
