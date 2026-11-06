"use client";

import { useState } from "react";
import "./page.css";

export default function Home() {
  // আপাতত ডেমো হিসেবে false রাখা হলো। পরে Supabase Auth থেকে চেক হবে।
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  return (
    <div className="min-h-screen bg-bgMain pb-20 relative overflow-hidden">
      
      {/* ---------- HEADER ---------- */}
      <header className="header-bg px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="text-2xl font-extrabold text-yellow-400 tracking-wider">
          {/* Logo */}
          Casino
        </div>
        
        {/* Header Right Side (Login dependent) */}
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            // ১ম ছবি: Login & Register
            <>
              <button className="border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                Login
              </button>
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold">
                Register
              </button>
            </>
          ) : (
            // ২য় ছবি: Profile Pic, Balance, Username
            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-full border border-borderCol">
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-6 h-6 rounded-full border border-white" />
              <div className="flex flex-col text-[10px] leading-tight text-white pr-2">
                <span className="font-bold">rashedul88w</span>
                <span className="text-yellow-400 flex items-center gap-1">
                  <span className="bg-yellow-600 w-3 h-3 rounded-sm inline-block"></span> 0.00
                </span>
              </div>
            </div>
          )}
          <button className="text-white text-xl ml-1">🇺🇸</button>
          <button className="text-white text-xl ml-1">☰</button>
        </div>
      </header>

      {/* ---------- NOTIFICATION BAR ---------- */}
      <div className="px-3 mt-2">
        <div className="bg-bgSec border border-borderCol rounded-full py-1.5 px-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-white"><span>🔔</span> করুণ! 👑 দৈনিক প্রথম আমানত বোনাস ২০%! ✨</span>
          <span className="text-yellow-400 text-lg">✉️</span>
        </div>
      </div>

      {/* ---------- HERO BANNER ---------- */}
      <div className="px-3 mt-3">
        <div className="banner-bg rounded-lg p-2 h-36 flex items-center justify-center relative overflow-hidden">
          <img src="https://placehold.co/600x200/0F212E/00E701?text=Hero+Banner" alt="Banner" className="w-full h-full object-cover rounded-lg opacity-80" />
          <div className="absolute flex gap-1 bottom-2">
            <span className="w-4 h-1.5 bg-yellow-500 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
          </div>
        </div>
      </div>

      {/* ---------- ACTION BUTTONS ---------- */}
      <div className="px-3 mt-3 grid grid-cols-4 gap-2">
        <button className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
          <span>Deposit</span>
        </button>
        <button className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
          <span>Withdraw</span>
        </button>
        <button className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
          <span>Cashback</span>
        </button>
        <button className="bg-gradient-to-b from-yellow-300 to-yellow-500 text-black font-bold text-xs py-2 rounded-full flex flex-col items-center justify-center">
          <span>Mission</span>
        </button>
      </div>

      {/* ---------- JACKPOT ---------- */}
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

      {/* ---------- GAME CATEGORIES ---------- */}
      <div className="px-3 mt-4 grid grid-cols-4 gap-2">
        {["Hot", "Slot", "Live", "Fishing"].map((item, idx) => (
          <div key={idx} className={`bg-bgSec rounded-md p-2 flex flex-col items-center justify-center border border-borderCol ${idx === 0 ? 'bg-blue-600/30' : ''}`}>
            <span className="text-xl mb-1">{["🔥", "🎰", "🎲", "🎣"][idx]}</span>
            <span className="text-xs text-textSec font-semibold">{item}</span>
          </div>
        ))}
      </div>

      {/* ---------- GAME CARDS ---------- */}
      <div className="px-3 mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((game) => (
          <div key={game} className="bg-bgSec rounded-md overflow-hidden relative aspect-square border border-borderCol">
             <img src={`https://placehold.co/150x150/1A2C38/FFF?text=Game+${game}`} alt={`Game ${game}`} className="w-full h-full object-cover" />
             <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-[10px] text-white">JL</div>
          </div>
        ))}
      </div>

      {/* ---------- FLOATING BUTTONS (Right side) ---------- */}
      <div className="fixed right-3 bottom-24 flex flex-col gap-3 z-50">
        <button className="w-10 h-10 rounded-full floating-btn flex items-center justify-center text-white">✈️</button>
        <button className="w-10 h-10 rounded-full floating-btn flex items-center justify-center text-white">✈️</button>
        <button className="w-10 h-10 rounded-full bg-blue-800 border border-blue-500 flex items-center justify-center text-white">f</button>
        <button className="w-10 h-10 rounded-full bg-blue-800 border border-blue-500 flex items-center justify-center text-white">🎧</button>
      </div>

      {/* ---------- BOTTOM NAVIGATION ---------- */}
      <nav className="bottom-nav fixed bottom-0 w-full flex justify-around items-center py-2 z-50">
        <div className="flex flex-col items-center text-yellow-400">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center text-textSec">
          <span className="text-xl">🎁</span>
          <span className="text-[10px]">Promotion</span>
        </div>
        
        {/* Center Invite Button */}
        <div className="relative -top-5">
          <button className="w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex flex-col items-center justify-center shadow-lg border-4 border-bgMain">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold text-black leading-none mt-1">Invite</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-textSec">
          <span className="text-xl">🏆</span>
          <span className="text-[10px]">Reward</span>
        </div>
        <div className="flex flex-col items-center text-textSec relative">
          <span className="text-xl">👑</span>
          <span className="text-[10px]">Member</span>
          {isLoggedIn && (
            <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-bgMain font-bold">3</span>
          )}
        </div>
      </nav>

    </div>
  );
}
