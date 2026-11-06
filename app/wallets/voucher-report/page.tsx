"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function VoucherReportPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ফিল্টার মডাল স্টেট
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, filterType, statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/user/login");
      return;
    }

    let query = supabase
      .from("user_deposit_transaction")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("transaction_type", "deposit")
      .order("created_at", { ascending: false });

    // তারিখ অনুযায়ী ফিল্টার
    const now = new Date();
    if (activeTab === "today") {
      const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      query = query.gte("created_at", startOfToday);
    } else if (activeTab === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte("created_at", startOfYesterday).lte("created_at", endOfYesterday);
    } else if (activeTab === "7days") {
      const last7Days = new Date(now);
      last7Days.setDate(last7Days.getDate() - 7);
      query = query.gte("created_at", last7Days.toISOString());
    }

    // টাইপ ফিল্টার
    if (filterType !== "all") {
      query = query.eq("method_code", filterType);
    }

    // স্ট্যাটাস ফিল্টার
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter.toLowerCase());
    }

    const { data, error } = await query;
    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bgMain text-textMain flex flex-col pb-10">
      
      {/* Header */}
      <header className="bg-bgSec px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-borderCol">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">Deposit Record</h1>
        <div className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
      </header>

      {/* Top Tabs (Today, Yesterday, 7-days) */}
      <div className="flex border-b border-borderCol bg-bgSec">
        {["today", "yesterday", "7days"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? "text-primary border-b-2 border-primary" : "text-textSec"
            }`}
          >
            {tab === "7days" ? "7-days" : tab}
          </button>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 p-3 border-b border-borderCol bg-bgSec">
        <button 
          onClick={() => setShowTypeModal(true)}
          className="flex-1 py-2 px-3 rounded border border-borderCol bg-bgMain text-xs text-textMain flex justify-between items-center"
        >
          <span>{filterType === "all" ? "All" : filterType}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button 
          onClick={() => setShowStatusModal(true)}
          className="flex-1 py-2 px-3 rounded border border-borderCol bg-bgMain text-xs text-textMain flex justify-between items-center"
        >
          <span>{statusFilter === "all" ? "Types" : statusFilter}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="flex-1 py-2 px-3 rounded border border-borderCol bg-bgMain text-xs text-textMain flex justify-center items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>11/07 - 11/07</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#2F4553] border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-textSec py-10 text-sm">No transactions found.</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-bgSec border border-borderCol rounded-lg p-4">
              {/* Method & Date */}
              <div className="mb-3">
                <h3 className="text-base font-bold text-textMain capitalize">{tx.method_code}</h3>
                <p className="text-xs text-textSec">{new Date(tx.created_at).toLocaleString()}</p>
              </div>

              {/* Details Box */}
              <div className="bg-bgMain rounded-lg p-3 flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textSec">Deposit ref#:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-textMain font-semibold">{tx.transaction_reference || "N/A"}</span>
                    <button className="text-textSec hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-textSec">
                  <span>Postscript:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between text-sm text-textSec">
                  <span>Received time:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between text-sm text-textSec">
                  <span>Handling fee:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between text-sm text-textSec">
                  <span>Promotions:</span>
                  <span>{tx.is_bonus_claimed ? `${tx.claimed_bonus_percentage}%` : "-"}</span>
                </div>
                <div className="flex justify-between text-sm text-textSec">
                  <span>Remarks:</span>
                  <span>-</span>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-textSec mb-1">Request</p>
                  <p className="text-sm font-bold text-danger">{tx.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-textSec mb-1">Received</p>
                  <p className="text-sm font-bold text-textMain">-</p>
                </div>
                <div>
                  <p className="text-xs text-textSec mb-1">Bonus</p>
                  <p className="text-sm font-bold text-textMain">{tx.claimed_bonus_amount || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-textSec mb-1">Status</p>
                  <p className="text-sm font-bold text-primary capitalize">{tx.status}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Type Filter Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-bgSec w-full rounded-t-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-borderCol">
              <span className="text-textSec text-sm">Please choose the deposit method</span>
              <button onClick={() => setShowTypeModal(false)} className="text-textSec">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {["All", "Send Money Bkash", "Send Money Nagad", "Bkash", "NAGAD", "ROCKET"].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setFilterType(item === "All" ? "all" : item); setShowTypeModal(false); }}
                  className="w-full text-left px-4 py-4 text-sm text-white border-b border-borderCol hover:bg-bgMain"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-bgSec w-full rounded-t-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-borderCol">
              <span className="text-textSec text-sm">Types</span>
              <button onClick={() => setShowStatusModal(false)} className="text-textSec">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {["All", "Approved", "Cancelled", "Pending", "New", "Reject"].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setStatusFilter(item === "All" ? "all" : item); setShowStatusModal(false); }}
                  className="w-full text-left px-4 py-4 text-sm text-white border-b border-borderCol hover:bg-bgMain"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
