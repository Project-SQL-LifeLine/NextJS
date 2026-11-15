"use client";

import React, { useState } from "react";

export default function ProfilePage() {
  const [selectedMethod, setSelectedMethod] = useState("visa");

  // আপনার ডাটাবেস থেকে ডাটা আসবে (উদাহরণস্বরূপ)
  const userBalance = "38,458.00";
  const trackId = "0245";
  const userName = "Smith Adam";
  
  // lottery_settings থেকে আসা ফি
  const adminFee = 210;
  const emergencyFund = 280;
  const transactionFee = 5;
  const vat = 267;
  const total = adminFee + emergencyFund + transactionFee + vat;

  // কাস্টম SVG আইকন কম্পোনেন্ট (কোনো প্যাকেজের প্রয়োজন নেই)
  const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  );

  const WifiIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 text-[#07130d]">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#05100b] text-white font-sans flex justify-center">
      {/* মোবাইল ভিউ কন্টেইনার */}
      <div className="w-full max-w-md p-5 pb-10 flex flex-col gap-6">
        
        {/* হেডার */}
        <div className="flex items-center justify-between mt-2">
          <button className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
            <BackIcon />
          </button>
          <h1 className="text-lg font-medium tracking-wide">Lottery Wallet</h1>
          <button className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
            <MoreIcon />
          </button>
        </div>

        {/* ভার্চুয়াল কার্ড (Virtual Card) */}
        <div className="relative w-full h-[220px] rounded-[24px] p-6 overflow-hidden shadow-2xl bg-gradient-to-br from-[#142f23] to-[#07130d] border border-white/5">
          {/* কার্ডের গ্লো ইফেক্ট */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffaa] opacity-10 blur-3xl rounded-full"></div>
          
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold italic tracking-wider text-white/90">VISA</h2>
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-1">Lottery Balance</p>
            <h3 className="text-3xl font-bold tracking-tight">$ {userBalance}</h3>
          </div>

          <div className="mt-6 flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-400 tracking-widest mb-1">•••• •••• •••• {trackId}</p>
              <p className="text-xs font-medium text-gray-300">{userName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Exp: 05/02/2025</p>
            </div>
          </div>

          {/* কন্টাক্টলেস আইকন */}
          <div className="absolute right-5 top-16 w-8 h-14 bg-[#e0fbf0] rounded-lg flex items-center justify-center opacity-90">
            <WifiIcon />
          </div>
        </div>

        {/* পেমেন্ট মেথড অপশন */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedMethod("visa")}
            className={`flex-1 h-14 rounded-xl flex items-center justify-center relative border ${
              selectedMethod === "visa"
                ? "bg-[#142f23] border-[#00ffaa]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <span className="font-bold italic text-lg">VISA</span>
            {selectedMethod === "visa" && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-[#00ffaa] rounded-full flex items-center justify-center">
                <CheckIcon />
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedMethod("mastercard")}
            className={`flex-1 h-14 rounded-xl flex items-center justify-center relative border ${
              selectedMethod === "mastercard"
                ? "bg-[#142f23] border-[#00ffaa]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex relative">
              <div className="w-6 h-6 bg-[#eb001b] rounded-full z-10"></div>
              <div className="w-6 h-6 bg-[#f79e1b] rounded-full -ml-3 opacity-90"></div>
            </div>
            {selectedMethod === "mastercard" && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-[#00ffaa] rounded-full flex items-center justify-center">
                <CheckIcon />
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedMethod("wise")}
            className={`flex-1 h-14 rounded-xl flex items-center justify-center relative border ${
              selectedMethod === "wise"
                ? "bg-[#142f23] border-[#00ffaa]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <span className="font-bold text-lg font-serif">WISE</span>
            {selectedMethod === "wise" && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-[#00ffaa] rounded-full flex items-center justify-center">
                <CheckIcon />
              </div>
            )}
          </button>
        </div>

        {/* পেমেন্ট ডিটেইলস (Glassmorphism) */}
        <div className="bg-[#0c1a14]/80 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm text-gray-400 mb-5">Fee & Payment Details</h3>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Administration Fee</span>
              <span>${adminFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Emergency Fund</span>
              <span>${emergencyFund}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction Fee</span>
              <span>${transactionFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VAT</span>
              <span>${vat}</span>
            </div>
          </div>

          {/* ড্যাশড লাইন */}
          <div className="w-full border-t border-dashed border-gray-600/50 my-4"></div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-[#00ffaa] font-medium">Total</span>
            <span className="text-[#00ffaa] font-bold text-lg">${total}</span>
          </div>

          {/* প্রোমো কোড */}
          <div className="relative">
            <input
              type="text"
              placeholder="Promo Code"
              className="w-full bg-[#05100b] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa]/50 transition"
            />
          </div>
        </div>

        {/* সাবমিট বাটন */}
        <button className="w-full bg-[#00ffaa] text-[#05100b] font-bold text-base py-4 rounded-2xl mt-2 hover:bg-[#00e699] transition-colors shadow-[0_0_20px_rgba(0,255,170,0.3)]">
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
