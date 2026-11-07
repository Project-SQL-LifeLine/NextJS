"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function VoucherReportPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  // All Time ট্যাব যোগ করা হয়েছে
  const [activeTab, setActiveTab] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    // তারিখ অনুযায়ী ফিল্টার (All Time বাদে)
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
    // "all_time" হলে কোনো ডেট ফিল্টার থাকবে না

    if (filterType !== "all") query = query.eq("method_code", filterType);
    if (statusFilter !== "all") query = query.eq("status", statusFilter.toLowerCase());

    const { data, error } = await query;
    if (!error && data) setTransactions(data);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t("Copied!", "কপি করা হয়েছে!"));
  };

  // Total Deposit Calculation
  const totalDeposit = transactions
    .filter((tx) => tx.status === "approved")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const getMethodEmoji = (method: string) => {
    if (method?.toLowerCase() === "bkash") return "🔥";
    if (method?.toLowerCase() === "nagad") return "🔥";
    if (method?.toLowerCase() === "rocket") return "🚀";
    return "";
  };

  return (
    <div className="min-h-screen bg-[#0F212E] text-textMain flex flex-col pb-10">
      
      {/* Header */}
      <header className="bg-[#1A2C38] px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-[#2F4553]">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">{t("Deposit Record", "ডিপোজিট রেকর্ড")}</h1>
        <div className="w-6"></div>
      </header>

      {/* Top Tabs (Today, Yesterday, 7-Days, All Time) */}
      <div className="flex border-b border-[#2F4553] bg-[#1A2C38] overflow-x-auto no-scrollbar">
        {[
          { id: "today", en: "Today", bn: "আজ" },
          { id: "yesterday", en: "Yesterday", bn: "গতকাল" },
          { id: "7days", en: "7-Days", bn: "৭ দিন" },
          { id: "all_time", en: "All Time", bn: "সর্বকালের" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[80px] py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-textSec"
            }`}
          >
            {t(tab.en, tab.bn)}
          </button>
        ))}
      </div>

      {/* Filter Buttons & Small Total Deposit */}
      <div className="flex gap-2 p-3 border-b border-[#2F4553] bg-[#1A2C38] items-center">
        <button 
          onClick={() => setShowTypeModal(true)}
          className="w-24 py-2 px-2 rounded border border-[#2F4553] bg-[#0F212E] text-[11px] text-textMain flex justify-between items-center"
        >
          <span className="truncate">{filterType === "all" ? t("All", "সব") : filterType}</span>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button 
          onClick={() => setShowStatusModal(true)}
          className="w-24 py-2 px-2 rounded border border-[#2F4553] bg-[#0F212E] text-[11px] text-textMain flex justify-between items-center"
        >
          <span className="truncate">{statusFilter === "all" ? t("Types", "টাইপ") : statusFilter}</span>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="w-24 py-2 px-2 rounded border border-[#2F4553] bg-[#0F212E] text-[11px] text-textMain flex justify-center items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
        </div>

        {/* ছোট Total Deposit ডান কোণায় */}
        <div className="ml-auto flex flex-col items-end pl-2">
          <span className="text-[10px] text-textSec leading-none mb-1">{t("Total Deposit", "মোট ডিপোজিট")}</span>
          <span className="text-[#00E701] font-bold text-sm leading-none">৳ {totalDeposit.toLocaleString()}</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#2F4553] border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-textSec py-10 text-sm">{t("No transactions found.", "কোনো লেনদেন পাওয়া যায়নি।")}</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-[#1A2C38] border border-[#2F4553] rounded-xl p-4 shadow-sm">
              
              {/* Row 1: Method & Amount */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-bold text-base capitalize flex items-center gap-1">
                  {tx.method_code} <span>{getMethodEmoji(tx.method_code)}</span>
                </h3>
                <span className="text-white font-bold text-lg whitespace-nowrap">
                  ৳ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Row 2: Date */}
              <p className="text-[#B1BAD3] text-xs mb-3">
                {new Date(tx.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
              </p>

              {/* Row 3: Order Number (TrxID এর বদলে) & Status */}
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[#B1BAD3] text-sm font-mono truncate">{tx.order_number || "Generating..."}</span>
                  {tx.order_number && (
                    <button onClick={() => copyToClipboard(tx.order_number)} className="text-textSec hover:text-white flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  )}
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${
                  tx.status === "approved" ? "text-[#00E701]" : 
                  tx.status === "rejected" ? "text-[#ED4163]" : 
                  "text-[#F59E0B]"
                }`}>
                  {t(
                    tx.status === "approved" ? "Arrived" : tx.status === "rejected" ? "Rejected" : "Pending",
                    tx.status === "approved" ? "পৌঁছেছে" : tx.status === "rejected" ? "বাতিল" : "অপেক্ষমাণ"
                  )}
                </span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Type Filter Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-[#1A2C38] w-full rounded-t-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#2F4553]">
              <span className="text-textSec text-sm">{t("Please choose the deposit method", "ডিপোজিট মেথড নির্বাচন করুন")}</span>
              <button onClick={() => setShowTypeModal(false)} className="text-textSec">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {["All", "Bkash", "Nagad", "Rocket"].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setFilterType(item === "All" ? "all" : item.toLowerCase()); setShowTypeModal(false); }}
                  className="w-full text-left px-4 py-4 text-sm text-white border-b border-[#2F4553] hover:bg-[#0F212E]"
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
          <div className="bg-[#1A2C38] w-full rounded-t-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#2F4553]">
              <span className="text-textSec text-sm">{t("Types", "টাইপ")}</span>
              <button onClick={() => setShowStatusModal(false)} className="text-textSec">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {["All", "Approved", "Pending", "Rejected"].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setStatusFilter(item === "All" ? "all" : item.toLowerCase()); setShowStatusModal(false); }}
                  className="w-full text-left px-4 py-4 text-sm text-white border-b border-[#2F4553] hover:bg-[#0F212E]"
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
