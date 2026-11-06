"use client";

import { useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 relative overflow-hidden">
      
      {/* ================= HEADER ================= */}
      <header className="bg-[#0d2b45] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="text-2xl font-extrabold text-yellow-400 tracking-wider">
          Casino
        </div>
        
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <>
              <button className="border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                Login
              </button>
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold">
                Register
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-full border border-[#2F4553]">
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-6 h-6 rounded-full border border-white" />
              <div className="flex flex-col text-[10px] leading-tight text-white pr-2">
                <span className="font-bold">User123</span>
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

      {/* ================= MAIN CONTENT ================= */}
      <main>
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
      </main>

      {/* ================= FOOTER / BOTTOM NAV ================= */}
      <nav className="bg-[#1A2C38] border-t border-[#2F4553] fixed bottom-0 w-full flex justify-around items-center py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center text-yellow-400 cursor-pointer">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center text-[#B1BAD3] cursor-pointer">
          <span className="text-xl">🎁</span>
          <span className="text-[10px]">Promotion</span>
        </div>
        
        <div className="relative -top-5 cursor-pointer">
          <button className="w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex flex-col items-center justify-center shadow-lg border-4 border-[#0F212E]">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold text-black leading-none mt-1">Invite</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-[#B1BAD3] cursor-pointer">
          <span className="text-xl">🏆</span>
          <span className="text-[10px]">Reward</span>
        </div>
        <div className="flex flex-col items-center text-[#B1BAD3] relative cursor-pointer">
          <span className="text-xl">👑</span>
          <span className="text-[10px]">Member</span>
        </div>
      </nav>

    </div>
  );
}
