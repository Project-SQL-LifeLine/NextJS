"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "../lib/supabase/client";

// Bottom Navbar Icons
const NavIcons = {
  Home: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Promotion: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Lottery: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Reward: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  
  // Drawer স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDrawerOpen(false);
    router.push("/user/login");
  };

  // ড্রয়ার মেনু আইটেম
  const drawerMenu = [
    { name: t("Profile", "প্রোফাইল"), icon: <DrawerIcons.Profile />, path: "/member" },
    { name: t("VIP", "ভিআইপি"), icon: <DrawerIcons.VIP />, path: "/member/vip" },
    { name: t("Transactions", "লেনদেন"), icon: <DrawerIcons.Transactions />, path: "/member/transactions" },
    { name: t("Notification", "নোটিফিকেশন"), icon: <DrawerIcons.Notification />, path: "/member/notification" },
    { name: t("Redeem Code", "রিডিম কোড"), icon: <DrawerIcons.Redeem />, path: "/member/redeem" },
    { name: t("Affiliate Program", "অ্যাফিলিয়েট প্রোগ্রাম"), icon: <DrawerIcons.Affiliate />, path: "/member/affiliate" },
    { name: t("Settings", "সেটিংস"), icon: <DrawerIcons.Settings />, path: "/member/settings" },
    { name: t("Live Support", "লাইভ সাপোর্ট"), icon: <DrawerIcons.Support />, path: "/member/support" },
  ];

  return (
    <>
      {/* Drawer Overlay (Background Dark) */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer (Right Side) */}
      <div 
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-[#0d1e15] border-l border-[#1A2C38] z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1A2C38]">
          <h2 className="text-xl font-bold text-white">{t("My Account", "আমার অ্যাকাউন্ট")}</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-[#B1BAD3] hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Drawer Menu Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {drawerMenu.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => { setIsDrawerOpen(false); router.push(item.path); }}
              className="flex items-center gap-4 px-6 py-4 text-[#B1BAD3] hover:text-white hover:bg-[#1A2C38]/50 cursor-pointer transition-colors"
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Drawer Footer (Logout) */}
        <div className="p-4 border-t border-[#1A2C38]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[#ED4163] hover:bg-[#ED4163]/10 rounded-lg cursor-pointer transition-colors"
          >
            <DrawerIcons.Logout />
            <span className="font-bold text-sm">{t("Logout", "লগআউট")}</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-[#1A2C38] border-t border-[#2F4553] fixed bottom-0 w-full flex justify-around items-center py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        
        <Link href="/" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/") ? "text-primary" : "text-[#B1BAD3] hover:text-white"}`}>
          <NavIcons.Home />
          <span className={`text-[10px] font-bold mt-1 ${isActive("/") ? "text-primary" : "text-[#B1BAD3]"}`}>{t("Home", "হোম")}</span>
        </Link>

        <Link href="/promotion" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/promotion") ? "text-primary" : "text-[#B1BAD3] hover:text-white"}`}>
          <NavIcons.Promotion />
          <span className={`text-[10px] font-bold mt-1 ${isActive("/promotion") ? "text-primary" : "text-[#B1BAD3]"}`}>{t("Promotion", "প্রমোশন")}</span>
        </Link>
        
        {/* মাঝখানের বড় বাটন: Mega Lottery */}
        <div className="relative -top-5 cursor-pointer">
          <Link 
            href="/lottery"
            className="w-14 h-14 rounded-full bg-[#1475E0] flex flex-col items-center justify-center shadow-lg border-4 border-[#0F212E] hover:bg-[#0f5bb5] transition-colors"
          >
            <span className="text-white mb-0.5"><NavIcons.Lottery /></span>
            <span className="text-[8px] font-extrabold text-white leading-none uppercase tracking-wider">Mega</span>
          </Link>
        </div>

        <Link href="/reward" className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/reward") ? "text-primary" : "text-[#B1BAD3] hover:text-white"}`}>
          <NavIcons.Reward />
          <span className={`text-[10px] font-bold mt-1 ${isActive("/reward") ? "text-primary" : "text-[#B1BAD3]"}`}>{t("Reward", "রিওয়ার্ড")}</span>
        </Link>

        {/* Member এর বদলে Profile বাটন */}
        <button onClick={() => setIsDrawerOpen(true)} className="flex flex-col items-center relative cursor-pointer text-[#B1BAD3] hover:text-white transition-colors">
          <NavIcons.Profile />
          <span className="text-[10px] font-bold mt-1">{t("Profile", "প্রোফাইল")}</span>
        </button>
      </nav>
    </>
  );
}
