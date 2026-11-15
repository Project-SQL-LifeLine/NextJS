"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("game_id, lottery_balance, created_at")
            .eq("id", user.id)
            .single();
            
          if (data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // সামান্য লোডিং টাইম দেওয়া হলো যাতে UI সুন্দরভাবে লোড হয়
    const timer = new Promise((resolve) => setTimeout(resolve, 1000));
    Promise.all([fetchData(), timer]).then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05100b] flex flex-col items-center justify-center">
        <svg className="w-10 h-10 text-[#00ffaa] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="text-white mt-4 font-bold tracking-widest animate-pulse text-[11px]">LOADING WALLET...</p>
      </div>
    );
  }

  // ডাটাবেস থেকে আসা ডাটা ফরম্যাট করা
  const balance = Number(profile?.lottery_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const accountName = profile?.game_id || "Smith Adam"; // game_id থাকলে সেটা দেখাবে, না থাকলে ডামি নাম
  const creationDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : "N/A";

  return (
    <div className="min-h-screen bg-[#05100b] text-white font-sans flex flex-col relative">
      {/* হেডার */}
      <LotteryHeader userProfile={profile} />

      {/* মেইন কন্টেন্ট */}
      <div className="flex-1 w-full max-w-md mx-auto p-5 pb-24 flex flex-col gap-6">
        
        {/* ভার্চুয়াল কার্ড */}
        <div className="relative w-full h-[220px] rounded-[24px] p-6 overflow-hidden shadow-2xl bg-gradient-to-br from-[#142f23] to-[#07130d] border border-white/5 mt-4">
          {/* কার্ডের গ্লো ইফেক্ট */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffaa] opacity-10 blur-3xl rounded-full"></div>
          
          <div className="flex justify-between items-start">
            {/* VISA এর জায়গায় Account Holder Name */}
            <h2 className="text-lg font-bold text-white/90">Account Holder Name</h2>
          </div>

          <div className="mt-8">
            <p className="text-xs text-gray-400 mb-1">Lottery Balance</p>
            {/* profiles টেবিলের lottery_balance */}
            <h3 className="text-3xl font-bold tracking-tight">৳ {balance}</h3>
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div>
              {/* ডামি কার্ড নাম্বার */}
              <p className="text-[10px] text-gray-400 tracking-widest mb-1">•••• •••• •••• 0245</p>
              <p className="text-xs font-medium text-gray-300">{accountName}</p>
            </div>
            <div>
              {/* Exp এর জায়গায় Account Creation Date */}
              <p className="text-[10px] text-gray-400">Since: {creationDate}</p>
            </div>
          </div>

          {/* কন্টাক্টলেস আইকন */}
          <div className="absolute right-5 top-16 w-8 h-14 bg-[#e0fbf0] rounded-lg flex items-center justify-center opacity-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#07130d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
          </div>
        </div>

        {/* বাকি সব সেকশন (Payment Methods, Fee Details) সরিয়ে দেওয়া হয়েছে */}

      </div>

      {/* ফুটার */}
      <LotteryFooter />
    </div>
  );
}
