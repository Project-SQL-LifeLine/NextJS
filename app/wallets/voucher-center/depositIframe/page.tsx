"use client";

import { useState } from "react";
import "./voucherCenterdepositIframe.css";

export default function DepositIframePage() {
  const [txnId, setTxnId] = useState("");
  const walletNumber = "01810018030";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletNumber);
    alert("Wallet number copied!");
  };

  const handleSubmit = () => {
    if (!txnId) {
      alert("Please enter Transaction ID");
      return;
    }
    // এখানে Supabase-এ ডিপোজিট রিকোয়েস্ট পাঠানোর লজিক বসবে
    alert("Submit clicked! TXN ID: " + txnId);
  };

  return (
    <div className="iframe-container">
      {/* হেডার */}
      <div className="iframe-header">
        <div>
          <h1>BDT 2,000</h1>
          <p>Don't over or under cash out.</p>
        </div>
        <div className="text-right text-xs">
          <p>PAY SERVICE</p>
        </div>
      </div>

      <div className="iframe-content">
        {/* লাল সতর্কবার্তা */}
        <div className="warning-text-red">
          If you change the amount (BDT 2,000), you won't get the credit
        </div>

        {/* পিংক কার্ড */}
        <div className="bkash-card">
          <div className="bkash-logo">
            bKash
          </div>
          <h2>BKASH Deposit</h2>
        </div>

        {/* ওয়ালেট নাম্বার */}
        <div className="wallet-label">Wallet No*</div>
        <div className="wallet-note">This BKASH number only accepts cashouts.</div>
        <div className="wallet-box">
          <span>{walletNumber}</span>
          <span className="copy-btn" onClick={copyToClipboard}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </span>
        </div>

        {/* ট্রানজেকশন আইডি */}
        <div className="txn-label">Transaction ID* <span>(Required)</span></div>
        <input
          type="text"
          className="txn-input"
          placeholder="TrxID Required!"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
        />

        {/* সাবমিট বাটন */}
        <button className="submit-btn" onClick={handleSubmit}>
          Submit
        </button>

        {/* ওয়ার্নিং সেকশন */}
        <div className="warning-section">
          <h3>Warning:</h3>
          <div className="red-subtext">Transaction ID must be filled in correctly, otherwise the score will fail!</div>
          <p>Please note that you make deposit to BKASH deposit. Be sure that you make the payment from the same wallet, otherwise it may be lost.</p>
        </div>
      </div>
    </div>
  );
}
