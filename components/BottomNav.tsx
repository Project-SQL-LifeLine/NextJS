"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";

// সাদা SVG আইকন সেট (হাই-কোয়ালিটি)
const Icons = {
  Home: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Promotion: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Lottery: () => (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Reward: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Member: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#1A2C38] border-t border-[#2F4553] fixed bottom-0 w-full flex justify-around items-center py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      
      <Link href="/" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/") ? "text-[#1475E0]" : "text-[#B1BAD3] hover:text-white"}`}>
        <Icons.Home />
        <span className={`text-[10px] font-bold mt-1 ${isActive("/") ? "text-[#1475E0]" : "text-[#B1BAD3]"}`}>{t("Home", "হোম")}</span>
      </Link>

      <Link href="/promotion" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/promotion") ? "text-[#1475E0]" : "text-[#B1BAD3] hover:text-white"}`}>
        <Icons.Promotion />
        <span className={`text-[10px] font-bold mt-1 ${isActive("/promotion") ? "text-[#1475E0]" : "text-[#B1BAD3]"}`}>{t("Promotion", "প্রমোশন")}</span>
      </Link>
      
      {/* মাঝখানের বড় বাটন: Mega Lottery */}
      <div className="relative -top-5 cursor-pointer">
        <Link 
          href="/lottery"
          className="w-16 h-16 rounded-full bg-[#1475E0] flex flex-col items-center justify-center shadow-lg border-4 border-[#0F212E] hover:bg-[#0f5bb5] transition-colors"
        >
          <span className="text-white"><Icons.Lottery /></span>
          <span className="text-[9px] font-extrabold text-white leading-none mt-0.5 uppercase tracking-wide">Mega</span>
        </Link>
      </div>

      <Link href="/reward" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/reward") ? "text-[#1475E0]" : "text-[#B1BAD3] hover:text-white"}`}>
        <Icons.Reward />
        <span className={`text-[10px] font-bold mt-1 ${isActive("/reward") ? "text-[#1475E0]" : "text-[#B1BAD3]"}`}>{t("Reward", "রিওয়ার্ড")}</span>
      </Link>

      <Link href="/member" className={`flex flex-col items-center relative cursor-pointer transition-colors ${isActive("/member") ? "text-[#1475E0]" : "text-[#B1BAD3] hover:text-white"}`}>
        <Icons.Member />
        <span className={`text-[10px] font-bold mt-1 ${isActive("/member") ? "text-[#1475E0]" : "text-[#B1BAD3]"}`}>{t("Member", "মেম্বার")}</span>
      </Link>
    </nav>
  );
}
