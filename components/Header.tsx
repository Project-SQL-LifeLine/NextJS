"use client";

import Link from "next/link";

export default function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="bg-[#0d2b45] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="text-2xl font-extrabold text-yellow-400 tracking-wider">
        Casino
      </div>
      
      <div className="flex items-center gap-2">
        {!isLoggedIn ? (
          <>
            {/* Login বাটন */}
            <Link 
              href="/user/login" 
              className="border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-500/10 transition"
            >
              Login
            </Link>
            {/* Register বাটন */}
            <Link 
              href="/user/signup" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold hover:opacity-90 transition"
            >
              Register
            </Link>
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
  );
}
