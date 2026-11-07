"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function VoucherReportPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t("Copied!", "কপি করা হয়েছে!"));
  };

  // Total Deposit Calculation (শুধুমাত্র Approved ডিপোজিটগুলোর যোগফল)
  const totalDeposit = transactions
    .filter((tx) => tx.status === "approved")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // মেথড অনুযায়ী ইমোজি
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

      {/* Top Tabs (Today, Yesterday, 7-days) */}
      <div className="flex border-b border-[#2F4553] bg-[#1A2C38]">
        {["today", "yesterday", "7days"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? "text-primary border-b-2 border-primary" : "text-textSec"
            }`}
          >
            {tab === "7days" ? t("7-Days", "৭ দিন") : tab === "today" ? t("Today", "আজ") : t("Yesterday", "গতকাল")}
          </button>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 p-3 border-b border-[#2F4553] bg-[#1A2C38]">
        <button 
          onClick={() => setShowTypeModal(true)}
          className="flex-1 py-2 px-3 rounded border border-[#2F4553] bg-[#0F212E] text-xs text-textMain flex justify-between items-center"
        >
          <span>{filterType === "all" ? t("All", "সব") : filterType}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button 
          onClick={() => setShowStatusModal(true)}
          className="flex-1 py-2 px-3 rounded border border-[#2F4553] bg-[#0F212E] text-xs text-textMain flex justify-between items-center"
        >
          <span>{statusFilter === "all" ? t("Types", "টাইপ") : statusFilter}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="flex-1 py-2 px-3 rounded border border-[#2F4553] bg-[#0F212E] text-xs text-textMain flex justify-center items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
        </div>
      </div>

      {/* Total Deposit Summary */}
      <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-[#1A2C38] to-[#253B49] border border-[#2F4553] flex justify-between items-center shadow-lg">
        <div>
          <p className="text-textSec text-xs font-semibold mb-1">{t("Total Deposit", "সর্বমোট ডিপোজিট")}</p>
          <h2 className="text-2xl font-bold text-[#00E701]">৳ {totalDeposit.toLocaleString()}</h2>
        </div>
        <div className="w-10 h-10 bg-[#00E701]/10 rounded-full flex items-center justify-center text-[#00E701]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold text-base capitalize flex items-center gap-1">
                  {tx.method_code} <span>{getMethodEmoji(tx.method_code)}</span>
                </h3>
                <span className="text-white font-bold text-lg">৳ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Row 2: Date */}
              <p className="text-[#B1BAD3] text-xs mb-3">
                {new Date(tx.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
              </p>

              {/* Row 3: TrxID & Status */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[#B1BAD3] text-sm font-mono truncate max-w-[200px]">{tx.transaction_reference || "N/A"}</span>
                  {tx.transaction_reference && (
                    <button onClick={() => copyToClipboard(tx.transaction_reference)} className="text-textSec hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  )}
                </div>
                <span className={`text-xs font-bold ${
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
