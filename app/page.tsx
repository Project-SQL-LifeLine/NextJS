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
  
  // জ্যাকপট নাম্বার (ডেমো)
  const [jackpotAmount, setJackpotAmount] = useState(372022775);

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

  // জ্যাকপট নাম্বার বাড়ানোর ডেমো অ্যানিমেশন
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + Math.floor(Math.random() * 50));
    }, 2000);
    return () => clearInterval(interval);
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

      {/* ব্যানার স্লাইডার */}
      <div className="px-3 mt-3">
        <div className="bg-[#092238] border border-[#2F4553] rounded-lg p-2 h-36 flex items-center justify-center relative overflow-hidden">
          {banners.length > 0 ? (
            <a href={banners[currentBanner].redirect_url || "#"} className="w-full h-full relative block">
              <img 
                src={banners[currentBanner].image_url} 
                alt="Banner" 
                className="w-full h-full object-cover rounded-lg opacity-90 transition-opacity duration-500" 
              />
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

      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Deposit", "Withdraw", "Cashback", "Mission"].map((btn, i) => (
          <button key={i} className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
            {btn}
          </button>
        ))}
      </div>

      {/* Lottery Jackpot কার্ড (আপনার ছবির মতো ডিজাইন) */}
      <div className="px-3 mt-4">
        <div className="relative bg-gradient-to-r from-[#1A2C38] via-[#253B49] to-[#1A2C38] rounded-xl border border-[#00E701] overflow-hidden shadow-[0_0_15px_rgba(0,231,1,0.2)] p-4 flex flex-col items-center justify-center">
          
          {/* গ্লো ইফেক্ট ব্যাকগ্রাউন্ড */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

          {/* JACKPOT টাইটেল */}
          <h2 className="relative text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00E701] tracking-widest drop-shadow-md uppercase">
            Lottery Jackpot
          </h2>
          
          {/* জ্যাকপট নাম্বার ডিসপ্লে */}
          <div className="relative mt-2 flex items-center justify-center gap-1">
            {jackpotAmount.toString().padStart(9, '0').split('').map((digit, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-10 bg-[#0F212E] border border-[#2F4553] rounded flex items-center justify-center shadow-inner">
                  <span className="text-white font-bold text-xl">{digit}</span>
                </div>
                {/* কমা বসানোর লজিক (৩ ডিজিট পর পর) */}
                {(index + 1) % 3 === 0 && index !== 8 && (
                  <span className="text-[#00E701] font-bold text-xl mx-1">,</span>
                )}
              </div>
            ))}
          </div>
          
        </div>
      </div>

      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-[#00E701]/10' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className={`text-xs font-semibold ${idx === 0 ? 'text-[#00E701]' : 'text-[#B1BAD3]'}`}>{item}</span>
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
