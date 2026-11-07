"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useLanguage } from "../../lib/LanguageContext";
import BottomNav from "../../components/BottomNav";

// কাস্টম SVG আইকনসমূহ (সব সাদা)
const Icons = {
  Rewards: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  BetHistory: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ProfitLoss: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Deposit: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
  Withdraw: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" /></svg>,
  History: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  Account: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Security: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Invite: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  Rebate: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Message: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Suggestion: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Download: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Service: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Help: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Logout: () => <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

export default function MemberPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/user/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) setUserProfile(profile);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/user/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F212E] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2F4553] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  // মেনু আইটেম লিস্ট
  const menuItems = [
    { name: t("My Rewards", "আমার পুরষ্কার"), icon: <Icons.Rewards />, link: "/member/rewards" },
    { name: t("Bet History", "বাজি হিস্ট্রি"), icon: <Icons.BetHistory />, link: "/member/bets" },
    { name: t("Profit And Loss", "লাভ ও ক্ষতি"), icon: <Icons.ProfitLoss />, link: "/member/profit-loss" },
    { name: t("Deposit Record", "ডিপোজিট রেকর্ড"), icon: <Icons.Deposit />, link: "/wallets/voucher-report" },
    { name: t("Withdrawal Record", "উত্তোলন রেকর্ড"), icon: <Icons.Withdraw />, link: "/wallets/withdrawal-report" },
    { name: t("Transaction History", "লেনদেন হিস্ট্রি"), icon: <Icons.History />, link: "/member/transactions" },
    { name: t("My Account", "আমার অ্যাকাউন্ট"), icon: <Icons.Account />, link: "/member/account" },
    { name: t("Security Center", "সিকিউরিটি সেন্টার"), icon: <Icons.Security />, link: "/wallets/securityCenter/addBankCard" },
    { name: t("Invite Friends", "বন্ধুদের আমন্ত্রণ"), icon: <Icons.Invite />, link: "/member/invite" },
    { name: t("Rebate", "রিবেট"), icon: <Icons.Rebate />, link: "/member/rebate" },
    { name: t("Internal Message", "অভ্যন্তরীণ বার্তা"), icon: <Icons.Message />, link: "/member/messages", badge: 2 },
    { name: t("Suggestion", "পরামর্শ"), icon: <Icons.Suggestion />, link: "/member/suggestion" },
    { name: t("Download APP", "অ্যাপ ডাউনলোড"), icon: <Icons.Download />, link: "#" },
    { name: t("Customer Service", "কাস্টমার সার্ভিস"), icon: <Icons.Service />, link: "/member/support" },
    { name: t("Help Center", "হেল্প সেন্টার"), icon: <Icons.Help />, link: "/member/help" },
    { name: t("Logout", "লগআউট"), icon: <Icons.Logout />, link: "#", onClick: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-[#0F212E] pb-20 font-sans text-white">
      
      {/* Header */}
      <header className="bg-[#1A2C38] px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-[#2F4553]">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">{t("My Account", "আমার অ্যাকাউন্ট")}</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4">
        
        {/* Profile Card */}
        <div className="relative bg-gradient-to-br from-[#1A2C38] to-[#253B49] border border-[#2F4553] rounded-2xl p-5 shadow-lg overflow-hidden mb-6">
          {/* ব্যাকগ্রাউন্ড ইফেক্ট */}
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>

          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="relative">
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-16 h-16 rounded-full border-2 border-[#00E701] object-cover" />
              <div className="absolute -bottom-1 -right-1 bg-[#00E701] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                VIP 1
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{userProfile?.game_id || "User"}</h2>
                <button className="text-[#B1BAD3] hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
              <p className="text-[#B1BAD3] text-xs mt-1">
                {t("Joined", "যোগদান")}: {new Date(userProfile?.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-extrabold text-[#00E701]">
                ৳ {Number(userProfile?.balance || 0).toLocaleString()}
              </h3>
              <button onClick={() => window.location.reload()} className="text-[#B1BAD3] hover:text-white bg-[#0F212E] p-1.5 rounded-full border border-[#2F4553]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>

          <div className="flex gap-2 relative z-10">
            <button onClick={() => router.push("/wallets/voucher-center")} className="flex-1 bg-[#0F212E] border border-[#2F4553] text-white py-2 rounded-lg text-sm font-semibold hover:border-[#00E701] transition-colors">
              {t("Deposit", "ডিপোজিট")}
            </button>
            <button onClick={() => router.push("/wallets/withdrawal")} className="flex-1 bg-[#0F212E] border border-[#2F4553] text-white py-2 rounded-lg text-sm font-semibold hover:border-[#00E701] transition-colors">
              {t("Withdrawal", "উত্তোলন")}
            </button>
            <button onClick={() => router.push("/wallets/securityCenter/addBankCard")} className="flex-1 bg-[#0F212E] border border-[#2F4553] text-white py-2 rounded-lg text-sm font-semibold hover:border-[#00E701] transition-colors">
              {t("Bank Account", "ব্যাংক অ্যাকাউন্ট")}
            </button>
          </div>
        </div>

        {/* Member Center Title */}
        <div className="inline-block bg-[#1A2C38] border border-[#2F4553] px-4 py-1.5 rounded-full mb-4">
          <span className="text-sm font-bold text-[#B1BAD3]">{t("Member Center", "মেম্বার সেন্টার")}</span>
        </div>

        {/* Menu Grid (4 columns) */}
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              onClick={() => {
                if (item.onClick) item.onClick();
                else if (item.link !== "#") router.push(item.link);
              }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="relative w-12 h-12 rounded-full bg-[#1A2C38] border border-[#2F4553] flex items-center justify-center group-hover:border-[#00E701] transition-colors">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-[#ED4163] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0F212E] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-center text-[#B1BAD3] font-medium leading-tight group-hover:text-white transition-colors">
                {item.name}
              </span>
            </div>
          ))}
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
