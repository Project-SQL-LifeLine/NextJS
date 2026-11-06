"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase/client";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // পেজ লোড হওয়ার সময় সেশন চেক করা
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        // ইউজারের প্রোফাইল ডাটা আনা (ব্যালেন্স, ইউজারনেম)
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

    checkSession();

    // Auth স্টেট পরিবর্তন হলে (লগইন/লগআউট) আবার চেক করবে
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

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 relative overflow-hidden">
      
      <Header isLoggedIn={isLoggedIn} userProfile={userProfile} />

      {/* Notification Bar */}
      <div className="px-3 mt-3">
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-full py-1.5 px-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-white"><span>🔔</span> করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨</span>
          <span className="text-yellow-400 text-lg">✉️</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="px-3 mt-3">
        <div className="bg-[#092238] border border-[#2F4553] rounded-lg p-2 h-36 flex items-center justify-center relative overflow-hidden">
          <img src="https://placehold.co/600x200/0F212E/00E701?text=Hero+Banner" alt="Banner" className="w-full h-full object-cover rounded-lg opacity-80" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Deposit", "Withdraw", "Cashback", "Mission"].map((btn, i) => (
          <button key={i} className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
            {btn}
          </button>
        ))}
      </div>

      {/* Jackpot */}
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

      {/* Game Categories */}
      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-[#1A2C38] rounded-md p-2 flex flex-col items-center justify-center border border-[#2F4553] ${idx === 0 ? 'bg-blue-600/30' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className="text-xs text-[#B1BAD3] font-semibold">{item}</span>
          </div>
        ))}
      </div>

      {/* Game Cards */}
      <div className="px-3 mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((game) => (
          <div key={game} className="bg-[#1A2C38] rounded-md overflow-hidden relative aspect-square border border-[#2F4553]">
             <img src={`https://placehold.co/150x150/1A2C38/FFF?text=Game+${game}`} alt={`Game ${game}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Floating Buttons */}
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
