"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";

export default function WithdrawalReportPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState("today");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

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
      .eq("transaction_type", "withdrawal")
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

    const { data, error } = await query;
    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  // স্ট্যাটাস অনুযায়ী কালার নির্ধারণ
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return "text-green-600 bg-green-50 border-green-200";
      case "rejected": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-orange-500 bg-orange-50 border-orange-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return t("Approved", "অনুমোদিত");
      case "rejected": return t("Rejected", "বাতিল");
      default: return t("Pending", "অপেক্ষমাণ");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-[#0A2C6B] px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-white">{t("Withdrawal Record", "উত্তোলন রেকর্ড")}</h1>
        <div className="w-6"></div>
      </header>

      {/* Top Tabs (Today, Yesterday, 7-days) */}
      <div className="flex border-b border-gray-200 bg-white sticky top-[60px] z-40 shadow-sm">
        {["today", "yesterday", "7days"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? "text-[#0A2C6B] border-b-2 border-[#0A2C6B]" : "text-gray-500"
            }`}
          >
            {tab === "7days" ? t("7-days", "৭ দিন") : tab === "today" ? t("Today", "আজ") : t("Yesterday", "গতকাল")}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {t("No withdrawal records found.", "কোনো উত্তোলন রেকর্ড পাওয়া যায়নি।")}
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              
              {/* Method & Date */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 capitalize">{tx.method_code}</h3>
                  <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tx.status)}`}>
                  {getStatusText(tx.status)}
                </span>
              </div>

              {/* Details Box */}
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2 mb-3 border border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("Account No:", "একাউন্ট নম্বর:")}</span>
                  <span className="text-gray-900 font-semibold">{tx.transaction_reference || "-"}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t("Requested Amount:", "অনুরোধকৃত পরিমাণ:")}</span>
                  <span className="font-bold text-[#0A2C6B] text-base">৳ {Number(tx.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t("Processing Time:", "প্রসেসিং সময়:")}</span>
                  <span>-</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
