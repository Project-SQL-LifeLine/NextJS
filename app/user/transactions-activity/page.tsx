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

  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [filterType, setFilterType] = useState("all"); 
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

      const { data: methodsData } = await supabase
        .from("control_payment_method")
        .select("method_code, method_name, method_logo_url");
      
      if (methodsData) setPaymentMethods(methodsData);

      const { data: txData, error } = await supabase
        .from("user_deposit_transaction")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (txData) {
        let depTotal = 0;
        let withTotal = 0;
        
        txData.forEach(tx => {
          if (tx.transaction_type === 'deposit') {
            depTotal += Number(tx.amount);
          } else if (tx.transaction_type === 'withdrawal' || tx.transaction_type === 'withdraw') {
            withTotal += Number(tx.amount);
          }
        });

        setTotalDeposit(depTotal);
        setTotalWithdraw(withTotal);

        const formatted = txData.map(d => ({
          id: d.id,
          type: d.transaction_type,
          method_code: d.method_code || "",
          amount: Number(d.amount),
          status: d.status,
          date: d.created_at,
          order_number: d.order_number
        }));

        setTransactions(formatted);
      }

    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = transactions.filter((tx) => {
    let matchType = false;
    if (filterType === "all") matchType = true;
    else if (filterType === "deposit") matchType = tx.type === "deposit";
    else if (filterType === "withdrawal") matchType = tx.type === "withdrawal" || tx.type === "withdraw";

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
        <p>{t("Loading...", "লোড হচ্ছে...")}</p>
      </div>
    );
  }

  return (
    <div className="tx-page">
      <Header isLoggedIn={isLoggedIn} userProfile={profile} />

      <main className="tx-main">
        <h1 className="tx-title">{t("Transactions Activity", "লেনদেনের বিবরণ")}</h1>

        <div className="tx-summary-grid">
          <div className="tx-summary-card">
            <span>{t("Total Deposit", "মোট ডিপোজিট")}</span>
            <strong className="text-deposit">৳ {totalDeposit.toLocaleString()}</strong>
          </div>
          <div className="tx-summary-card">
            <span>{t("Total Withdraw", "মোট উত্তোলন")}</span>
            <strong className="text-withdraw">৳ {totalWithdraw.toLocaleString()}</strong>
          </div>
        </div>

        <div className="tx-filter-section">
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
              className={`tx-filter-btn ${filterType === "withdrawal" ? "active" : ""}`}
              onClick={() => setFilterType("withdrawal")}
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
              placeholder={t("Filter by Date", "তারিখ অনুযায়ী ফিল্টার")}
            />
          </div>
        </div>

        <div className="tx-list">
          {filteredTransactions.length === 0 ? (
            <div className="tx-empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>{t("No transactions found.", "কোনো লেনদেন পাওয়া যায়নি।")}</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isWithdraw = tx.type === "withdrawal" || tx.type === "withdraw";
              
              const matchedMethod = paymentMethods.find(m => {
                const dbCode = (m.method_code || "").toLowerCase();
                const dbName = (m.method_name || "").toLowerCase();
                const txCode = (tx.method_code || "").toLowerCase();
                
                return dbCode === txCode || 
                       dbName.includes(txCode) || 
                       txCode.includes(dbCode);
              });
              
              const logoUrl = matchedMethod?.method_logo_url;

              return (
                <div key={tx.id} className="tx-item">
                  <div className="tx-item-left">
                    <div className={`tx-icon ${isWithdraw ? "withdraw" : "deposit"}`}>
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={tx.method_code} 
                          className="tx-logo-img" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        !isWithdraw ? (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        ) : (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        )
                      )}
                    </div>
                    <div className="tx-info">
                      <strong>{!isWithdraw ? t("Deposit", "ডিপোজিট") : t("Withdraw", "উত্তোলন")}</strong>
                      <span>{new Date(tx.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {tx.order_number && <span className="tx-order-id">ID: {tx.order_number}</span>}
                    </div>
                  </div>
                  <div className="tx-item-right">
                    <span className={`tx-amount ${isWithdraw ? "withdraw" : "deposit"}`}>
                      {!isWithdraw ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                    </span>
                    <span className={`tx-badge ${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
