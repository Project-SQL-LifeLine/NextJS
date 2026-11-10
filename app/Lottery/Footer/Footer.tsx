"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";

export default function LotteryFooter() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#183F35] border-t border-[#26352e] fixed bottom-0 w-full flex justify-around items-center py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      
      {/* 1. Home / Play */}
      <Link href="/Lottery" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/Lottery") ? "text-[#F5B041]" : "text-white/70 hover:text-white"}`}>
        <div className={`p-1 rounded-lg ${isActive("/Lottery") ? "bg-[#F5B041]/10" : ""}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className="text-[9px] font-bold mt-0.5">{t("Play", "খেলুন")}</span>
      </Link>

      {/* 2. My Tickets */}
      <Link href="/Lottery/my-tickets" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/Lottery/my-tickets") ? "text-[#F5B041]" : "text-white/70 hover:text-white"}`}>
        <div className={`p-1 rounded-lg ${isActive("/Lottery/my-tickets") ? "bg-[#F5B041]/10" : ""}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
          </svg>
        </div>
        <span className="text-[9px] font-bold mt-0.5">{t("Tickets", "টিকিট")}</span>
      </Link>

      {/* 3. Winners */}
      <Link href="/Lottery/winners" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/Lottery/winners") ? "text-[#F5B041]" : "text-white/70 hover:text-white"}`}>
        <div className={`p-1 rounded-lg ${isActive("/Lottery/winners") ? "bg-[#F5B041]/10" : ""}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <span className="text-[9px] font-bold mt-0.5">{t("Winners", "বিজয়ী")}</span>
      </Link>

      {/* 4. Withdraw */}
      <Link href="/Lottery/withdraw" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/Lottery/withdraw") ? "text-[#F5B041]" : "text-white/70 hover:text-white"}`}>
        <div className={`p-1 rounded-lg ${isActive("/Lottery/Secure-cashout-activity") ? "bg-[#F5B041]/10" : ""}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-[9px] font-bold mt-0.5">{t("Withdraw", "উত্তোলন")}</span>
      </Link>
    </nav>
  );
}
