"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import GameCard from "../components/GameCard";
import { supabase } from "../lib/supabase/client";
import { useLanguage } from "../lib/LanguageContext";
import "./Loader.css"; // 👈 নতুন লোডার CSS ইমপোর্ট করা হলো

// ডাইনামিক SVG আইকন হেল্পার
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
  const [categories, setCategories] = useState<string[]>([]);
  const [allHomeGames, setAllHomeGames] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); 
  const [filteredGames, setFilteredGames] = useState<any[]>([]); 

  // লাইভ সাপোর্ট লিংক স্টেট
  const [supportLink, setSupportLink] = useState<string>("");
  
  // 🚀 নতুন লোডিং স্টেট
  const [isLoading, setIsLoading] = useState(true);
  
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
      try {
        setIsLoading(true); // লোডিং শুরু

        // ১. ব্যানার ফেচ
        const { data: bannerData } = await supabase
          .from("home_banners")
          .select("*")
          .eq("is_active", true)
          .order("serial", { ascending: true });
        if (bannerData) setBanners(bannerData);

        // ২. অ্যাডমিন সেটিংস থেকে সাপোর্ট লিংক ফেচ
        const { data: settingsData } = await supabase
          .from("admin_settings")
          .select("support_link")
          .limit(1)
          .maybeSingle();
          
        if (settingsData && settingsData.support_link) {
          setSupportLink(settingsData.support_link);
        }

        // ৩. গেম ফেচ (Home Page এর জন্য)
        const { data: gameData } = await supabase
          .from("home_categories_create")
          .select("*")
          .eq("is_active", true)
          .eq("is_game", true) 
          .contains("display_locations", ["home"]) 
          .order("serial", { ascending: true });

        if (gameData) {
          setAllHomeGames(gameData);

          const uniqueCats = Array.from(new Set(gameData.map(g => g.category_group || "General")));
          setCategories(uniqueCats as string[]);

          if (uniqueCats.length > 0) {
            setSelectedCategory(uniqueCats[0] as string);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // ডাটা আসা শেষ হলে লোডিং বন্ধ হবে
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

  // ব্যানার অটো স্লাইড
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

  // 🚀 ডাটা লোড হওয়ার সময় শুধু এই স্পিনারটি দেখাবে
  if (isLoading) {
    return (
      <div className="loader-wrapper">
        <svg className="svg-spinner" viewBox="0 0 50 50">
          <circle className="path" cx="25" cy="25" r="20"></circle>
        </svg>
      </div>
    );
  }

  // ডাটা লোড হয়ে গেলে মূল কন্টেন্ট দেখাবে
  return (
    <div className="min-h-screen bg-[#0d241e] pb-20 relative overflow-hidden">
      
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
          className="bg-[#092238] border border-[#2F4553] rounded-xl overflow-hidden relative w-full min-h-[100px] cursor-grab active:cursor-grabbing touch-pan-y flex flex-col"
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseUp={(e) => handleEnd(e.clientX)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        >
          {banners.length > 0 ? (
            <>
              <div 
                className="flex transition-transform duration-500 ease-in-out w-full h-full"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <a 
                    key={banner.id}
                    href={banner.redirect_url || "#"} 
                    className="w-full flex-shrink-0 block"
                  >
                    <img src={banner.image_url} alt="Banner" className="w-full h-auto object-contain pointer-events-none" />
                  </a>
                ))}
              </div>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                {banners.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentBanner ? "bg-yellow-400" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">No banners available</div>
          )}
        </div>
      </div>

      {/* ক্যাটাগরি বাটন */}
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
                  ? "bg-[#183f35] border-[#183f35] text-white shadow-lg"
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

      {/* গেম কার্ড গ্রিড */}
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

      {/* লাইভ সাপোর্ট ফ্লোটিং বাটন */}
      {supportLink && (
        <div className="fixed right-4 bottom-24 flex flex-col gap-3 z-50">
          <a 
            href={supportLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center bg-[#1A2C38] border border-[#2F4553] rounded-full shadow-lg hover:bg-[#253B49] hover:scale-105 transition-all"
            title="Live Support"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
            </svg>
          </a>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
