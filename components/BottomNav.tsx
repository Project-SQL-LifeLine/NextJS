"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase/client";

// Bottom Navbar Icons
const NavIcons = {
  Casino: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z M8 8h.01 M16 8h.01 M12 12h.01 M8 16h.01 M16 16h.01" />
    </svg>
  ),
  Promotion: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Lottery: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
    </svg>
  ),
  Sports: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

// Drawer Icons
const DrawerIcons = {
  Profile: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  VIP: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Transactions: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Notification: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Redeem: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  Affiliate: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Support: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "/casino";
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDrawerOpen(false);
    router.push("/user/login");
  };

  const drawerMenu = [
    { name: t("My Profile", "আমার প্রোফাইল"), icon: <DrawerIcons.Profile />, path: "/user/profile" },
    { name: t("VIP", "ভিআইপি"), icon: <DrawerIcons.VIP />, path: "/member/vip" },
    { name: t("Deposit History", "ডিপোজিট হিস্ট্রি"), icon: <DrawerIcons.Transactions />, path: "/wallets/voucher-report" },
    { name: t("Withdrawal History", "উত্তোলন হিস্ট্রি"), icon: <DrawerIcons.Transactions />, path: "/wallets/withdrawal-report" },
    { name: t("Notification", "নোটিফিকেশন"), icon: <DrawerIcons.Notification />, path: "/member/notification" },
    { name: t("Redeem Code", "রিডিম কোড"), icon: <DrawerIcons.Redeem />, path: "/user/freeRedeemCode" },
    { name: t("Invite Friends", "বন্ধুদের আমন্ত্রণ"), icon: <DrawerIcons.Affiliate />, path: "/user/invitedFriend" },
    { name: t("Tips", "টিপস"), icon: <DrawerIcons.Transactions />, path: "/user/tips" },
    { name: t("Settings", "সেটিংস"), icon: <DrawerIcons.Settings />, path: "/user/settings" },
    { name: t("Live Support", "লাইভ সাপোর্ট"), icon: <DrawerIcons.Support />, path: "/member/support" },
  ];

  return (
    <>
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer (Full Screen & 11px Font) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full bg-[#0d1e15] z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1A2C38]">
          <h2 className="text-xl font-bold text-white">{t("My Account", "আমার অ্যাকাউন্ট")}</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-[#B1BAD3] hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {drawerMenu.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => { setIsDrawerOpen(false); router.push(item.path); }}
              className="flex items-center gap-4 px-6 py-4 text-[#B1BAD3] hover:text-white hover:bg-[#1A2C38]/50 cursor-pointer transition-colors"
            >
              {item.icon}
              {/* ফন্ট সাইজ 11px করা হলো */}
              <span className="font-medium text-[11px]">{item.name}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#1A2C38]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[#ED4163] hover:bg-[#ED4163]/10 rounded-lg cursor-pointer transition-colors"
          >
            <DrawerIcons.Logout />
            {/* ফন্ট সাইজ 11px করা হলো */}
            <span className="font-bold text-[11px]">{t("Logout", "লগআউট")}</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation (চিকন) */}
      <nav className="bg-[#184f35] border-t border-[#26352e] fixed bottom-0 w-full flex justify-around items-center py-1 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        
        {/* 1. Casino */}
        <Link href="/" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/") ? "text-[#00e701]" : "text-white/70 hover:text-white"}`}>
          <div className={`p-1 rounded-lg ${isActive("/") ? "border-2 border-[#00e701] bg-[#00e701]/10" : ""}`}>
            <NavIcons.Casino />
          </div>
          <span className={`text-[9px] font-bold mt-0.5 ${isActive("/") ? "text-[#00e701]" : "text-white/70"}`}>{t("Casino", "ক্যাসিনো")}</span>
        </Link>

        {/* 2. Promotion */}
        <Link href="/promotion" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/promotion") ? "text-[#00e701]" : "text-white/70 hover:text-white"}`}>
          <div className={`p-1 rounded-lg ${isActive("/promotion") ? "border-2 border-[#00e701] bg-[#00e701]/10" : ""}`}>
            <NavIcons.Promotion />
          </div>
          <span className={`text-[9px] font-bold mt-0.5 ${isActive("/promotion") ? "text-[#00e701]" : "text-white/70"}`}>{t("Promotion", "প্রমোশন")}</span>
        </Link>
        
        {/* 3. Mega Lottery */}
        <Link href="/lottery" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/lottery") ? "text-[#00e701]" : "text-white/70 hover:text-white"}`}>
          <div className={`p-1 rounded-lg ${isActive("/lottery") ? "border-2 border-[#00e701] bg-[#00e701]/10" : ""}`}>
            <NavIcons.Lottery />
          </div>
          <span className={`text-[8px] font-bold mt-0.5 text-center leading-tight ${isActive("/lottery") ? "text-[#00e701]" : "text-white/70"}`}>{t("Mega Lottery", "মেগা লটারি")}</span>
        </Link>

        {/* 4. Sports */}
        <Link href="/sports" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/sports") ? "text-[#00e701]" : "text-white/70 hover:text-white"}`}>
          <div className={`p-1 rounded-lg ${isActive("/sports") ? "border-2 border-[#00e701] bg-[#00e701]/10" : ""}`}>
            <NavIcons.Sports />
          </div>
          <span className={`text-[9px] font-bold mt-0.5 ${isActive("/sports") ? "text-[#00e701]" : "text-white/70"}`}>{t("Sports", "স্পোর্টস")}</span>
        </Link>

        {/* 5. Profiles (Drawer Opener) */}
        <button onClick={() => setIsDrawerOpen(true)} className="flex flex-col items-center cursor-pointer text-white/70 hover:text-white transition-colors">
          <div className="p-1 rounded-lg">
            <NavIcons.Profile />
          </div>
          <span className="text-[9px] font-bold mt-0.5">{t("Profiles", "প্রোফাইল")}</span>
        </button>
      </nav>
    </>
  );
}
