"use client";

import { useState } from "react";
import Link from "next/link";
import { mainMenuItems, casinoMenuItems, lotteryMenuItems } from "../../lib/adminMenu";

interface AdminSidebarProps {
  pathname: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

export default function AdminSidebar({ pathname, isSidebarOpen, setIsSidebarOpen }: AdminSidebarProps) {
  // 🌟 মডাল স্টেট (null, 'casino', অথবা 'lottery')
  const [activeModal, setActiveModal] = useState<"casino" | "lottery" | null>(null);

  const handleExit = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_pin_verified");
    }
    setIsSidebarOpen(false);
  };

  const closeModal = () => setActiveModal(null);

  // কোন মেনু আইটেমগুলো দেখাবে তা ঠিক করা
  const getModalItems = () => {
    if (activeModal === "casino") return casinoMenuItems;
    if (activeModal === "lottery") return lotteryMenuItems;
    return [];
  };

  const getModalTitle = () => {
    if (activeModal === "casino") return "Casino Menu";
    if (activeModal === "lottery") return "Lottery Menu";
    return "";
  };

  return (
    <>
      {/* মোবাইল ওভারলে */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* সাইডবার */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between border-b border-gray-200 px-4 md:justify-center">
          <Link href="/admin" className="text-xl font-extrabold text-blue-600 tracking-wider uppercase">
            Admin Panel
          </Link>
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-800 p-2 -mr-2 z-50 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1 px-3">
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/admin" && item.path !== "casino" && item.path !== "lottery" && pathname.startsWith(item.path));
              
              // 🌟 যদি আইটেমটি Modal হয় (Casino বা Lottery)
              if (item.isModal) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => setActiveModal(item.path as "casino" | "lottery")}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        <span className="font-semibold text-sm">{item.name}</span>
                      </div>
                      {/* ড্রপডাউন অ্যারো আইকন */}
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                );
              }

              // 🌟 সাধারণ লিংক
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    onClick={() => setIsSidebarOpen(false)} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

        {/* Bottom Area */}
        <div className="p-4 border-t border-gray-200">
          <Link 
            href="/" 
            onClick={handleExit}
            className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Back to Site
          </Link>
        </div>
      </aside>

      {/* 🌟 সাব-মেনু মডাল (Popup) */}
      {activeModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* মডাল হেডার */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">{getModalTitle()}</h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* মডাল বডি (স্ক্রলেবল) */}
            <div className="overflow-y-auto p-3 flex flex-col gap-1">
              {getModalItems().map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => {
                      closeModal();
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-bold" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
