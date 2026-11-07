"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepositAmount: 0,
    totalWithdrawalAmount: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // ১. মোট ইউজার
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // ২. মোট ডিপোজিট (শুধু approved)
        const { data: deposits } = await supabase
          .from("user_deposit_transaction")
          .select("amount")
          .eq("transaction_type", "deposit")
          .eq("status", "approved"); // ধরে নিচ্ছি approved হলে টাকা যোগ হয়

        // ৩. মোট উইথড্র (শুধু approved)
        const { data: withdrawals } = await supabase
          .from("user_deposit_transaction")
          .select("amount")
          .eq("transaction_type", "withdrawal")
          .eq("status", "approved");

        // ৪. পেন্ডিং ডিপোজিট
        const { count: pendingDep } = await supabase
          .from("user_deposit_transaction")
          .select("*", { count: "exact", head: true })
          .eq("transaction_type", "deposit")
          .eq("status", "pending");

        // ৫. পেন্ডিং উইথড্র
        const { count: pendingWith } = await supabase
          .from("user_deposit_transaction")
          .select("*", { count: "exact", head: true })
          .eq("transaction_type", "withdrawal")
          .eq("status", "pending");

        // ক্যালকুলেশন
        const totalDepositAmt = deposits?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalWithdrawalAmt = withdrawals?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        setStats({
          totalUsers: userCount || 0,
          totalDepositAmount: totalDepositAmt,
          totalWithdrawalAmount: totalWithdrawalAmt,
          pendingDeposits: pendingDep || 0,
          pendingWithdrawals: pendingWith || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2F4553] border-t-[#1475E0] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-[#B1BAD3] text-sm mt-1">Welcome back! Here is the latest summary of your casino.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-[#1475E0] hover:bg-[#0f5bb5] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Data
        </button>
      </div>

      {/* স্ট্যাটস গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* কার্ড ১: মোট ইউজার */}
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[#B1BAD3] text-sm font-semibold mb-1">Total Users</p>
            <h2 className="text-2xl font-bold text-white">{stats.totalUsers}</h2>
          </div>
          <div className="w-12 h-12 bg-[#1475E0]/20 rounded-full flex items-center justify-center text-[#1475E0]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
        </div>

        {/* কার্ড ২: মোট ডিপোজিট */}
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[#B1BAD3] text-sm font-semibold mb-1">Total Deposits</p>
            <h2 className="text-2xl font-bold text-[#00E701]">৳ {stats.totalDepositAmount.toLocaleString()}</h2>
          </div>
          <div className="w-12 h-12 bg-[#00E701]/20 rounded-full flex items-center justify-center text-[#00E701]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
        </div>

        {/* কার্ড ৩: মোট উইথড্র */}
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[#B1BAD3] text-sm font-semibold mb-1">Total Withdrawals</p>
            <h2 className="text-2xl font-bold text-[#ED4163]">৳ {stats.totalWithdrawalAmount.toLocaleString()}</h2>
          </div>
          <div className="w-12 h-12 bg-[#ED4163]/20 rounded-full flex items-center justify-center text-[#ED4163]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </div>
        </div>

        {/* কার্ড ৪: পেন্ডিং রিকোয়েস্টস */}
        <div className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-[#F59E0B]/10 rounded-bl-full pointer-events-none"></div>
          <p className="text-[#B1BAD3] text-sm font-semibold mb-1">Pending Actions</p>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-[#B1BAD3]">Deposits</span>
              <span className="text-lg font-bold text-[#F59E0B]">{stats.pendingDeposits}</span>
            </div>
            <div className="w-px bg-[#2F4553]"></div>
            <div className="flex flex-col">
              <span className="text-xs text-[#B1BAD3]">Withdrawals</span>
              <span className="text-lg font-bold text-[#F59E0B]">{stats.pendingWithdrawals}</span>
            </div>
          </div>
        </div>

      </div>

      {/* কুইক লিংকস (পেন্ডিং রিকোয়েস্টগুলোতে যাওয়ার জন্য) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href="/admin/deposits" className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 hover:border-[#1475E0] transition-colors flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Manage Deposits</h3>
            <p className="text-[#B1BAD3] text-sm">Review and approve user deposit requests.</p>
          </div>
          <div className="text-[#1475E0]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>

        <Link href="/admin/withdrawals" className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-5 hover:border-[#1475E0] transition-colors flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Manage Withdrawals</h3>
            <p className="text-[#B1BAD3] text-sm">Review and approve user withdrawal requests.</p>
          </div>
          <div className="text-[#1475E0]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      </div>

    </div>
  );
}
