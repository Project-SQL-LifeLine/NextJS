"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase/client";

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

  const noticeText = banners.length > 0 && banners[0].notice_text 
    ? banners[0].notice_text 
    : "করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨";

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 relative overflow-hidden">
      
      {/* স্ক্রলিং অ্যানাউন্সমেন্ট স্টাইল */}
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

      {/* স্ক্রলিং অ্যানাউন্সমেন্ট */}
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

      {/* ব্যানার স্লাইডার (Cross Fade & Fully Fitted) */}
      <div className="px-3 mt-3">
        <div className="bg-[#092238] border border-[#2F4553] rounded-xl overflow-hidden h-40 relative">
          {banners.length > 0 ? (
            <>
              {banners.map((banner, index) => (
                <a 
                  key={banner.id}
                  href={banner.redirect_url || "#"} 
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out block ${
                    index === currentBanner ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img 
                    src={banner.image_url} 
                    alt="Banner" 
                    className="w-full h-full object-cover" 
                  />
                </a>
              ))}
              
              {/* ডট ইন্ডিকেটর */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
            <div className="flex h-full items-center justify-center text-textSec text-sm">No banners available</div>
          )}
        </div>
      </div>

      {/* ক্যাটাগরি বাটন */}
      <div className="px-3 mt-6 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-[#1475E0]/10' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className={`text-xs font-semibold ${idx === 0 ? 'text-[#1475E0]' : 'text-[#B1BAD3]'}`}>{item}</span>
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
