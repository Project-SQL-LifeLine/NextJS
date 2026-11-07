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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModifyState, setShowModifyState] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // ডাইনামিক ওয়ালেট নাম্বার (ডেমো)
  const walletNumber = method.includes("Bkash") ? "01967961725" : "01962778104";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletNumber);
    alert("Wallet number copied!");
  };

  const handleInitialSubmit = () => {
    if (!txnId) {
      alert("Please enter Transaction ID");
      return;
    }
    setShowConfirmModal(true); 
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setShowModifyState(true); // ৪ নাম্বার ছবির মত এডিট বক্স দেখাবে
  };

  const handleEditClick = () => {
    setShowEditConfirmModal(true); // ৫ নাম্বার ছবির মত পপআপ
  };

  const handleFinalSubmit = async () => {
    setShowEditConfirmModal(false);
    
    // ডাটাবেসে সেভ করা
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("user_deposit_transaction").insert({
        user_id: session.user.id,
        transaction_type: "deposit",
        method_code: method,
        amount: amount,
        transaction_reference: txnId,
        status: "pending",
        claimed_bonus_percentage: bonusPercent,
        applied_bonus_id: bonusId
      });
    }
    
    setIsSubmitted(true); // ৬ নাম্বার ছবির সফল টিক মার্ক
  };

  // ৭ নাম্বার ছবির ভিউ
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
        
        <div className="iframe-content text-center pt-10">
          <h2 className="text-xl font-bold mb-6">{method}</h2>
          <h3 className="text-lg font-bold text-left mb-4">Order placed</h3>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-left">
              <p className="text-gray-500 text-sm">Deposit account</p>
              <p className="font-bold text-lg">mdrashedul</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded" onClick={copyToClipboard}>Copy</button>
          </div>
          
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <p className="text-gray-500 text-sm">Deposit Amounts</p>
              <p className="font-bold text-lg">৳ {amount}</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded">Copy</button>
          </div>

          <div className="text-left text-sm text-gray-600 space-y-2">
            <p className="font-bold text-black">Tips</p>
            <p>After the funds were transferred, kindly click on the "complete deposit" button</p>
            <p className="mt-4">-Feel free to contact us if you have any questions.</p>
            <a href="#" className="underline text-blue-600 font-semibold mt-2 block">Customer Service</a>
          </div>
        </div>

        {/* ৭ নাম্বার ছবির লাল বটম বার */}
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
      <div className="iframe-header">
        <div>
          <h1>BDT {amount}</h1>
          <p>Don't over or under cash out.</p>
        </div>
        <div className="text-right text-xs">
          <p>PAY SERVICE</p>
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
              // ৪ নাম্বার ছবির এডিট ভিউ
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

            <button className="submit-btn" onClick={showModifyState ? handleFinalSubmit : handleInitialSubmit}>
              Submit
            </button>
          </>
        ) : (
          // ৬ নাম্বার ছবির সফল ভিউ
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

      {/* ৩ নাম্বার ছবির কনফার্ম মডাল */}
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

      {/* ৫ নাম্বার ছবির এডিট কনফার্ম মডাল */}
      {showEditConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box text-left">
            <h3 className="text-center font-bold text-xl mb-6">Are you sure you want to change?</h3>
            <div className="flex justify-center gap-4">
              <button className="btn-yes" onClick={handleFinalSubmit}>Yes</button>
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
