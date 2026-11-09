"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { useLanguage } from "../../../lib/LanguageContext";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import "./transactions.css";
import "./transactions-loader.css";

export default function TransactionsActivityPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // ডাটা স্টেট
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);

  // ফিল্টার স্টেট
  const [filterType, setFilterType] = useState("all"); // all, deposit, withdraw
  const [selectedDate, setSelectedDate] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/user/login");
        return;
      }

      setIsLoggedIn(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      // ১. ডিপোজিট ডাটা আনা (আপনার টেবিলের নাম অনুযায়ী পরিবর্তন করুন)
      const { data: depositsData } = await supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .eq("user_id", user.id);

      // ২. উইথড্র ডাটা আনা (আপনার টেবিলের নাম অনুযায়ী পরিবর্তন করুন)
      const { data: withdrawsData } = await supabase
        .from("withdrawals")
        .select("id, amount, status, created_at")
        .eq("user_id", user.id);

      // ডাটা ফরম্যাট করা
      const formattedDeposits = (depositsData || []).map(d => ({
        id: d.id,
        type: "deposit",
        amount: Number(d.amount),
        status: d.status,
        date: d.created_at
      }));

      const formattedWithdraws = (withdrawsData || []).map(w => ({
        id: w.id,
        type: "withdraw",
        amount: Number(w.amount),
        status: w.status,
        date: w.created_at
      }));

      // সব ডাটা একসাথে করে তারিখ অনুযায়ী সাজানো (নতুন আগে)
      const allTx = [...formattedDeposits, ...formattedWithdraws].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTx);

      // মোট ডিপোজিট এবং উইথড্র ক্যালকুলেশন
      const totalDep = formattedDeposits.reduce((sum, item) => sum + item.amount, 0);
      const totalWith = formattedWithdraws.reduce((sum, item) => sum + item.amount, 0);
      
      setTotalDeposit(totalDep);
      setTotalWithdraw(totalWith);

    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ফিল্টার লজিক
  const filteredTransactions = transactions.filter((tx) => {
    const matchType = filterType === "all" || tx.type === filterType;
    
    let matchDate = true;
    if (selectedDate) {
      const txDate = new Date(tx.date).toISOString().split('T')[0];
      matchDate = txDate === selectedDate;
    }

    return matchType && matchDate;
  });

  if (loading) {
    return (
      <div className="tx-loader-container">
        <svg className="tx-loader-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p>Loading Transactions...</p>
      </div>
    );
  }

  return (
    <div className="tx-page">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="tx-main">
        <h1 className="tx-title">{t("Transactions Activity", "লেনদেনের বিবরণ")}</h1>

        {/* সামারি কার্ড */}
        <div className="tx-summary-grid">
          <div className="tx-summary-card deposit">
            <span>{t("Total Deposit", "মোট ডিপোজিট")}</span>
            <strong>৳ {totalDeposit.toLocaleString()}</strong>
          </div>
          <div className="tx-summary-card withdraw">
            <span>{t("Total Withdraw", "মোট উত্তোলন")}</span>
            <strong>৳ {totalWithdraw.toLocaleString()}</strong>
          </div>
        </div>

        {/* ফিল্টার সেকশন */}
        <div className="tx-filters">
          <div className="tx-type-filters">
            <button 
              className={`tx-filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              {t("All", "সব")}
            </button>
            <button 
              className={`tx-filter-btn ${filterType === "deposit" ? "active" : ""}`}
              onClick={() => setFilterType("deposit")}
            >
              {t("Deposits", "ডিপোজিট")}
            </button>
            <button 
              className={`tx-filter-btn ${filterType === "withdraw" ? "active" : ""}`}
              onClick={() => setFilterType("withdraw")}
            >
              {t("Withdraws", "উত্তোলন")}
            </button>
          </div>

          <div className="tx-date-filter">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="tx-date-input"
            />
            {selectedDate && (
              <button className="tx-clear-date" onClick={() => setSelectedDate("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* লিস্ট সেকশন */}
        <div className="tx-list">
          {filteredTransactions.length === 0 ? (
            <div className="tx-empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>{t("No transactions found.", "কোনো লেনদেন পাওয়া যায়নি।")}</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={`${tx.type}-${tx.id}`} className="tx-item">
                <div className="tx-item-left">
                  <div className={`tx-icon ${tx.type}`}>
                    {tx.type === "deposit" ? (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    )}
                  </div>
                  <div className="tx-info">
                    <strong>{tx.type === "deposit" ? t("Deposit", "ডিপোজিট") : t("Withdraw", "উত্তোলন")}</strong>
                    <span>{new Date(tx.date).toLocaleString()}</span>
                  </div>
                </div>
                <div className="tx-item-right">
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === "deposit" ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                  </span>
                  <span className={`badge ${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
