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
    // ১. সেশন চেক
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

    // ২. ব্যানার ডাটা আনা
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

  // ৩. ব্যানার স্লাইডারের জন্য টাইমার
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 3000); // ৩ সেকেন্ড পর পর পরিবর্তন হবে

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

      {/* ডাইনামিক ব্যানার স্লাইডার */}
      <div className="px-3 mt-3">
        <div className="bg-[#092238] border border-[#2F4553] rounded-lg p-2 h-36 flex items-center justify-center relative overflow-hidden">
          {banners.length > 0 ? (
            <a 
              href={banners[currentBanner].redirect_url || "#"} 
              className="w-full h-full relative block"
            >
              <img 
                src={banners[currentBanner].image_url} 
                alt="Banner" 
                className="w-full h-full object-cover rounded-lg opacity-90 transition-opacity duration-500" 
              />
              {/* স্লাইডার ডট ইন্ডিকেটর */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full ${idx === currentBanner ? "bg-yellow-400" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </a>
          ) : (
            <div className="text-textSec text-sm">No banners available</div>
          )}
        </div>
      </div>

      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Deposit", "Withdraw", "Cashback", "Mission"].map((btn, i) => (
          <button key={i} className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
            {btn}
          </button>
        ))}
      </div>

      <div className="px-3 mt-4">
        <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg border border-blue-400 p-3 flex flex-col items-center justify-center overflow-hidden">
          <h2 className="text-yellow-400 font-extrabold text-2xl drop-shadow-md">JACKPOT</h2>
          <div className="bg-blue-950/80 px-4 py-1 rounded-md border border-blue-500 mt-1">
            <span className="text-white font-mono text-lg tracking-widest">
              {(592182757).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-blue-600/30' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className="text-xs text-[#B1BAD3] font-semibold">{item}</span>
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
        <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">✈️</button>
        <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">✈️</button>
        <button className="w-10 h-10 rounded-full bg-blue-800 border border-blue-500 flex items-center justify-center text-white shadow-lg">f</button>
        <button className="w-10 h-10 rounded-full bg-blue-800 border border-blue-500 flex items-center justify-center text-white shadow-lg">🎧</button>
      </div>

      <BottomNav />
    </div>
  );
}
