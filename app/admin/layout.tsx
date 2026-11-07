"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // সাইডবার মেনু লিস্ট
  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Users", path: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { name: "Deposit Requests", path: "/admin/deposits", icon: "M12 4v16m8-8H4" },
    { name: "Withdraw Requests", path: "/admin/withdrawals", icon: "M20 12H4" },
    { name: "Payment Methods", path: "/admin/payment-methods", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { name: "Bonuses", path: "/admin/bonuses", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
    { name: "Banners & Notice", path: "/admin/banners", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Categories", path: "/admin/categories", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { name: "Bets History", path: "/admin/bets", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Settings", path: "/admin/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
  ];

  return (
    // মোবাইল স্ক্রিনে ডেক্সটপ ভিউ দেখার জন্য র‍্যাপার (zoom: 0.5 দেওয়া হলো যাতে স্ক্রিনে ফিট হয়)
    <div className="w-full h-screen overflow-auto bg-[#0F212E]">
      <div 
        className="flex font-sans text-gray-200 min-h-[900px]" 
        style={{ width: "1200px", zoom: "0.5" }} 
      >
        {/* Sidebar */}
        <aside className="bg-[#1A2C38] border-r border-[#2F4553] w-64 flex-shrink-0 flex flex-col">
          <div className="h-16 flex items-center justify-center border-b border-[#2F4553]">
            <Link href="/admin" className="text-xl font-extrabold text-[#1475E0] tracking-wider uppercase">
              Admin Panel
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <ul className="flex flex-col gap-1 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-[#1475E0] text-white" 
                          : "text-[#B1BAD3] hover:bg-[#253B49] hover:text-white"
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="font-semibold text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-4 border-t border-[#2F4553]">
            <Link href="/" className="flex items-center justify-center gap-2 w-full bg-[#253B49] hover:bg-[#2F4553] text-white py-2 rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Back to Site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-[#1A2C38] border-b border-[#2F4553] flex items-center justify-between px-6">
            <div className="text-[#B1BAD3] font-semibold text-sm">
              Desktop View Mode
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[#B1BAD3]">Admin User</span>
              <div className="w-8 h-8 rounded-full bg-[#1475E0] flex items-center justify-center text-white font-bold">A</div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
