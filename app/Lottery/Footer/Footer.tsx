"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";

export default function LotteryFooter() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#184f35] border-t border-[#26352e] fixed bottom-0 w-full flex justify-around items-center py-1 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      
      {/* 1. Home / Play */}
      <Link href="/Lottery" className={`flex flex-col items-center cursor-pointer transition-colors text-white`}>
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isActive("/Lottery") 
            ? "bg-[#183f35] shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-110" 
            : "hover:bg-white/10"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className={`text-[9px] font-bold mt-0.5 ${isActive("/Lottery") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-gray-300"}`}>
          {t("Play", "খেলুন")}
        </span>
      </Link>

      {/* 2. Checker */}
      <Link href="/Lottery/Chacker" className={`flex flex-col items-center cursor-pointer transition-colors text-white`}>
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isActive("/Lottery/Chacker") 
            ? "bg-[#183f35] shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-110" 
            : "hover:bg-white/10"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className={`text-[9px] font-bold mt-0.5 ${isActive("/Lottery/Chacker") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-gray-300"}`}>
          {t("Checker", "চেকার")}
        </span>
      </Link>

      {/* 3. My Tickets */}
      <Link href="/Lottery/tickets-buy-activity" className={`flex flex-col items-center cursor-pointer transition-colors text-white`}>
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isActive("/Lottery/tickets-buy-activity") 
            ? "bg-[#183f35] shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-110" 
            : "hover:bg-white/10"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
          </svg>
        </div>
        <span className={`text-[9px] font-bold mt-0.5 ${isActive("/Lottery/tickets-buy-activity") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-gray-300"}`}>
          {t("Tickets", "টিকিট")}
        </span>
      </Link>

      {/* 4. Winners */}
      <Link href="/Lottery/winners" className={`flex flex-col items-center cursor-pointer transition-colors text-white`}>
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isActive("/Lottery/winners") 
            ? "bg-[#183f35] shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-110" 
            : "hover:bg-white/10"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <span className={`text-[9px] font-bold mt-0.5 ${isActive("/Lottery/winners") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-gray-300"}`}>
          {t("Winners", "বিজয়ী")}
        </span>
      </Link>

      {/* 5. Profile (Transfer বাটনটি সরিয়ে দেওয়া হয়েছে) */}
      <Link href="/Lottery/Profile" className={`flex flex-col items-center cursor-pointer transition-colors text-white`}>
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isActive("/Lottery/Profile") 
            ? "bg-[#183f35] shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-110" 
            : "hover:bg-white/10"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className={`text-[9px] font-bold mt-0.5 ${isActive("/Lottery/Profile") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-gray-300"}`}>
          {t("Profile", "প্রোফাইল")}
        </span>
      </Link>

    </nav>
  );
}
