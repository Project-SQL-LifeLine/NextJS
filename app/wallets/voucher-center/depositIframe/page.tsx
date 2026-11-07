"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import "./voucherCenterdepositIframe.css";

function DepositIframeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const method = searchParams.get("method") || "Bkash";
  const logo = searchParams.get("logo") || "";
  const amount = Number(searchParams.get("amount")) || 500;
  const bonusPercent = Number(searchParams.get("bonus")) || 0;
  const bonusId = searchParams.get("bonus_id") || null;

  const [txnId, setTxnId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false); // ১ম পপআপ
  const [showModifyState, setShowModifyState] = useState(false); // এডিট ইনপুট বক্স
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false); // Yes/No পপআপ
  const [isSubmitted, setIsSubmitted] = useState(false); // সাকসেস মার্ক
  const [isOrderPlaced, setIsOrderPlaced] = useState(false); // ৭ম ছবি
  const [loading, setLoading] = useState(false);
  
  // ল্যাঙ্গুয়েজ স্টেট (EN / BN)
  const [lang, setLang] = useState<"EN" | "BN">("EN");

  const walletNumber = method.includes("Bkash") ? "01967961725" : "01962778104";
  const bonusAmount = (amount * bonusPercent) / 100;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletNumber);
    alert("Wallet number copied!");
  };

  // ১. প্রথম সাবমিট (Confirm পপআপ)
  const handleInitialSubmit = () => {
    if (!txnId) {
      alert("Please enter Transaction ID");
      return;
    }
    setShowConfirmModal(true); 
  };

  // ২. Confirm পপআপে ক্লিক
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setShowModifyState(true); 
  };

  // ৩. Modify বাটনে ক্লিক (Yes/No পপআপ)
  const handleEditClick = () => {
    setShowEditConfirmModal(true); 
  };

  // ৪. Yes ক্লিক করলে ডাটাবেসে সেভ হবে
  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowEditConfirmModal(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Please login first!");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("user_deposit_transaction").insert({
        user_id: session.user.id,
        transaction_type: "deposit",
        method_code: method,
        amount: amount,
        transaction_reference: txnId,
        status: "pending",
        is_bonus_claimed: bonusId ? true : false,
        applied_bonus_id: bonusId ? Number(bonusId) : null,
        claimed_bonus_amount: bonusAmount,
        claimed_bonus_percentage: bonusPercent,
      });

      if (error) {
        console.error("Database Error:", error);
        alert("Failed to submit: " + error.message);
      } else {
        setIsSubmitted(true); 
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // ৭ নম্বর ছবির Order Info ভিউ
  if (isOrderPlaced) {
    return (
      <div className="iframe-container">
        <div className="iframe-header" style={{ background: '#0b7a3e', padding: '15px' }}>
          <button onClick={() => router.push('/')} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-white font-bold text-lg">Deposit Info</span>
          <div></div>
        </div>
        
        <div className="iframe-content text-center pt-6">
          <h2 className="text-xl font-bold mb-6">{method}</h2>
          <h3 className="text-lg font-bold text-left mb-4">Order placed</h3>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-left">
              <p className="text-gray-500 text-sm">Deposit account</p>
              <p className="font-bold text-lg">mdrashedul</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded" onClick={copyToClipboard}>Copy</button>
          </div>
          
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <div className="text-left">
              <p className="text-gray-500 text-sm">Deposit Amounts</p>
              <p className="font-bold text-lg">৳ {amount}</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded">Copy</button>
          </div>

          {/* বোনাস ডিসপ্লে */}
          {bonusPercent > 0 && (
            <div className="flex justify-between items-center mb-6 text-green-700 bg-green-50 p-3 rounded">
              <div className="text-left">
                <p className="text-sm font-semibold">Claimed Bonus ({bonusPercent}%)</p>
                <p className="font-bold text-lg">৳ {bonusAmount.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="text-left text-sm text-gray-600 space-y-2">
            <p className="font-bold text-black">Tips</p>
            <p>After the funds were transferred, kindly click on the "complete deposit" button</p>
            <p className="mt-4">-Feel free to contact us if you have any questions.</p>
            <a href="#" className="underline text-blue-600 font-semibold mt-2 block">Customer Service</a>
          </div>
        </div>

        <div className="bottom-bar">
          <button onClick={() => router.push('/wallets/voucher-report')} className="bottom-bar-btn btn-white-outline">Transaction record</button>
          <button onClick={() => router.push('/')} className="bottom-bar-btn btn-blue">Complete deposit</button>
          <button onClick={() => window.location.reload()} className="bottom-bar-btn btn-white-outline">Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iframe-container">
      {/* হেডার আপডেট (PAY SERVICE, EN/BN যুক্ত করা হয়েছে) */}
      <div className="iframe-header">
        <div>
          <h1>BDT {amount}</h1>
          <p>{lang === "EN" ? "Don't over or under cash out." : "ক্যাশ আউটের চেয়ে বেশি বা কম দিবেন না।"}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-white font-bold text-sm">PAY SERVICE</p>
          <div className="flex bg-white rounded mt-1 overflow-hidden">
            <button onClick={() => setLang("EN")} className={`px-2 py-0.5 text-xs font-bold ${lang === "EN" ? "bg-gray-200 text-black" : "text-gray-500"}`}>EN</button>
            <button onClick={() => setLang("BN")} className={`px-2 py-0.5 text-xs font-bold ${lang === "BN" ? "bg-gray-200 text-black" : "text-gray-500"}`}>বাং</button>
          </div>
        </div>
      </div>

      <div className="iframe-content">
        <div className="warning-text-red">
          If you change the amount (BDT {amount}), you won't get the credit
        </div>

        <div className="bkash-card" style={{ backgroundColor: method.includes("Bkash") ? '#d10074' : '#f63' }}>
          <div className="bkash-logo">
            {logo ? <img src={logo} alt="logo" className="w-full h-full object-contain" /> : "Logo"}
          </div>
          <h2>{method} Deposit</h2>
        </div>

        <div className="wallet-label">Wallet No*</div>
        <div className="wallet-note">This {method} number only accepts Send Money.</div>
        <div className="wallet-box">
          <span>{walletNumber}</span>
          <span className="copy-btn" onClick={copyToClipboard}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </span>
        </div>

        {!isSubmitted ? (
          <>
            <div className="txn-label">Transaction ID* <span>(Required)</span></div>
            
            {showModifyState ? (
              // এডিট ভিউ (Modify বাটনসহ)
              <div className="modify-input-box">
                <input type="text" value={txnId} readOnly />
                <button className="btn-modify" onClick={handleEditClick}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Modify
                </button>
              </div>
            ) : (
              <input
                type="text"
                className="txn-input"
                placeholder="TrxID Required!"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
              />
            )}

            {/* Submit বাটন লজিক আপডেট করা হয়েছে */}
            <button 
              className="submit-btn" 
              onClick={showModifyState ? handleEditClick : handleInitialSubmit}
            >
              Submit
            </button>
          </>
        ) : (
          <div className="success-mark">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <button className="submit-btn" style={{ borderColor: '#0b7a3e', color: '#0b7a3e', width: '80%' }} onClick={() => setIsOrderPlaced(true)}>
              View Order Info
            </button>
          </div>
        )}

        <div className="warning-section">
          <h3>Warning:</h3>
          <div className="red-subtext">Transaction ID must be filled in correctly, otherwise the score will fail!</div>
          <p>Please note that you make deposit to {method} deposit. Be sure that you make the payment from the same wallet, otherwise it may be lost.</p>
        </div>
      </div>

      {/* ১ম পপআপ: Confirm Transaction ID */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>This order can only be submitted once, please confirm your Transaction ID: <span>{txnId}</span> is correct!</h3>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleConfirmSubmit}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ৩য় পপআপ: Yes / No */}
      {showEditConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box text-left">
            <h3 className="text-center font-bold text-xl mb-6">Are you sure you want to change?</h3>
            <div className="flex justify-center gap-4">
              {/* Yes ক্লিক করলে এখন সরাসরি সেভ না হয়ে ইনপুট বক্সে ফিরে যাবে */}
              <button 
                className="btn-yes" 
                onClick={() => {
                  setShowEditConfirmModal(false);
                  setShowModifyState(false); // এখানে স্টেট false করায় আবার ইনপুট বক্স দেখাবে
                }}
              >
                Yes
              </button>
              <button className="btn-no" onClick={() => setShowEditConfirmModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepositIframePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex justify-center items-center">Loading...</div>}>
      <DepositIframeContent />
    </Suspense>
  );
}
