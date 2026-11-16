"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import LotteryHeader from "../Header/Header";
import LotteryFooter from "../Footer/Footer";
import "./transactions.css";

export default function UserTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // ফিল্টার স্টেট
  const [filter, setFilter] = useState("all"); 
  
  // পেজিনেশন স্টেট (প্রথমে ৭টি দেখাবে)
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) setProfile(profileData);

        const { data, error } = await supabase
          .from("ticket_transactions")
          .select("*")
          .eq("user_id", user.id) // শুধু নিজের ডাটা
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setTransactions(data);

      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };

    // ৩.১ সেকেন্ডের (৩১০০ মিলি সেকেন্ড) লোডিং টাইমার
    const timer = new Promise((resolve) => setTimeout(resolve, 3100));
    
    // ডাটা ফেচ এবং টাইমার একসাথে শেষ হলে loading false হবে
    Promise.all([fetchTransactions(), timer]).then(() => {
      setLoading(false);
    });
  }, []);

  // ফিল্টার পরিবর্তন হলে visibleCount আবার ৭ এ রিসেট হবে
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setVisibleCount(7); 
  };

  // ফিল্টার লজিক
  const filteredData = transactions.filter(tx => {
    if (filter === "all") return true;
    return tx.transaction_type === filter;
  });

  // পেজিনেশন লজিক (৭টি করে কাটা)
  const displayedData = filteredData.slice(0, visibleCount);

  // Load More ক্লিক করলে ৭টি করে বাড়বে
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 7);
  };

  // ট্রানজেকশন টাইপের নাম এবং সাদা SVG আইকন নির্ধারণ
  const getTxDetails = (type: string) => {
    switch (type) {
      case "ticket_purchase":
        return {
          title: "Ticket Purchase",
          isNegative: true,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
            </svg>
          )
        };
      case "balance_reload":
        return {
          title: "Balance Reload",
          isNegative: false,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case "fee_payment":
        return {
          title: "Fee Payment",
          isNegative: true,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        };
      case "withdrawal":
        return {
          title: "Withdrawal",
          isNegative: true,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          )
        };
      default:
        return {
          title: type,
          isNegative: false,
          icon: null
        };
    }
  };

  // ==========================================
  // ৩.১ সেকেন্ডের সাদা লোডিং স্ক্রিন
  // ==========================================
  if (loading) {
    return (
      <div className="transactions-loading-wrapper">
        {/* Transactions / Wallet SVG */}
        <div className="svg-loader">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
            <path d="M7 15h.01M11 15h2"></path>
          </svg>
        </div>
        <p className="text-white mt-6 font-bold tracking-widest animate-pulse text-[12px]">
          LOADING TRANSACTIONS...
        </p>
      </div>
    );
  }

  return (
    <div className="transactions-page-wrapper">
      <LotteryHeader userProfile={profile} />

      <main className="transactions-main">
        
        {/* ফিল্টার ট্যাব */}
        <div className="filter-tabs">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => handleFilterChange("all")}>
            All
          </button>
          <button className={`filter-btn ${filter === "ticket_purchase" ? "active" : ""}`} onClick={() => handleFilterChange("ticket_purchase")}>
            Tickets
          </button>
          <button className={`filter-btn ${filter === "balance_reload" ? "active" : ""}`} onClick={() => handleFilterChange("balance_reload")}>
            Reloads
          </button>
          <button className={`filter-btn ${filter === "fee_payment" ? "active" : ""}`} onClick={() => handleFilterChange("fee_payment")}>
            Fees
          </button>
        </div>

        {/* ট্রানজেকশন লিস্ট */}
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
          </div>
        ) : (
          <>
            <div className="tx-list">
              {displayedData.map((tx) => {
                const details = getTxDetails(tx.transaction_type);
                
                return (
                  <div key={tx.id} className="tx-card">
                    <div className="tx-left">
                      <div className="tx-icon">
                        {details.icon}
                      </div>
                      <div className="tx-info">
                        <h4>{details.title}</h4>
                        <p>{tx.trx_id ? `Trx: ${tx.trx_id}` : tx.ticket_dp_track_id}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(tx.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="tx-right">
                      <span className={`tx-amount ${details.isNegative ? 'negative' : 'positive'}`}>
                        {details.isNegative ? '-' : '+'} ৳{Number(tx.amount).toLocaleString()}
                      </span>
                      <span className={`status-badge ${tx.status}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More বাটন (যদি আরও ডাটা থাকে) */}
            {visibleCount < filteredData.length && (
              <button className="load-more-btn" onClick={handleLoadMore}>
                Load More
              </button>
            )}
          </>
        )}

      </main>

      <LotteryFooter />
    </div>
  );
}
