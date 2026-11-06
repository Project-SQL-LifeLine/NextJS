"use client";

import Link from "next/link";

export default function Header({ isLoggedIn, userProfile }: { isLoggedIn: boolean, userProfile?: any }) {
  return (
    <header className="bg-[#0d2b45] px-3 py-2 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="text-2xl font-extrabold text-yellow-400 tracking-wider">
        Casino
      </div>
      
      <div className="flex items-center gap-2">
        {!isLoggedIn ? (
          <>
            <Link href="/user/login" className="border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-500/10 transition">
              Login
            </Link>
            <Link href="/user/signup" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold hover:opacity-90 transition">
              Register
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {/* Profile Info */}
            <div className="flex items-center gap-1.5 bg-black/30 px-1.5 py-1 rounded-l-full border border-[#2F4553] border-r-0">
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-6 h-6 rounded-full border border-white" />
              <div className="flex flex-col text-[10px] leading-tight text-white pr-1">
                <span className="font-bold">{userProfile?.game_id || "User"}</span>
                <span className="text-yellow-400 flex items-center gap-1">
                  <span className="bg-yellow-600 w-3 h-3 rounded-sm inline-block"></span> {userProfile?.balance || "0.00"}
                </span>
              </div>
            </div>
            {/* Wallet Icon */}
            <div className="bg-yellow-500 p-1.5 rounded-full border border-[#2F4553] -ml-3 z-10">
              <span className="text-black text-xs">💼</span>
            </div>
          </div>
        )}
        
        <button className="text-white text-xl ml-1">🇺🇸</button>
        <button className="text-white text-xl ml-1">☰</button>
      </div>
    </header>
  );
}
