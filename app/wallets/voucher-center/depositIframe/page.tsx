"use client";

import { useState, useEffect, Suspense } from "react";
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
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"EN" | "BN">("EN");

  const walletNumber = method.includes("Bkash") ? "01967961725" : "01962778104";
  const bonusAmount = (amount * bonusPercent) / 100;
  const totalAmount = amount + bonusAmount;

  // মোবাইলের Back বাটন হ্যান্ডেল করার লজিক
  useEffect(() => {
    if (isOrderPlaced) {
      // অর্ডার প্লেসড স্টেটে গেলে ব্রাউজারের হিস্ট্রিতে একটি ডামি স্টেট পুশ করবো
      window.history.pushState({ page: "orderPlaced" }, "");
    }

    const handlePopState = (event: PopStateEvent) => {
      // ব্যাক বাটনে ক্লিক করলে এই ইভেন্টটি ফায়ার হবে
      if (isOrderPlaced) {
        setIsOrderPlaced(false); // আবার সাকসেস পেজে (✔) ফিরে যাবে
      } else if (isSubmitted) {
        setIsSubmitted(false); // সাকসেস থেকে ইনপুট পেজে ফিরে যাবে
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOrderPlaced, isSubmitted]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletNumber);
    alert(lang === "EN" ? "Wallet number copied!" : "ওয়ালেট নম্বর কপি করা হয়েছে!");
  };

  const handleInitialSubmit = () => {
    if (!txnId) {
      alert(lang === "EN" ? "Please enter Transaction ID" : "অনুগ্রহ করে ট্রানজেকশন আইডি দিন");
      return;
    }
    setShowConfirmModal(true); 
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setShowModifyState(true); 
  };

  const handleEditClick = () => {
    setShowEditConfirmModal(true); 
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowEditConfirmModal(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert(lang === "EN" ? "Please login first!" : "অনুগ্রহ করে আগে লগইন করুন!");
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
        alert("Failed to submit: " + error.message);
      } else {
        setIsSubmitted(true); 
      }
    } catch (err) {
      alert(lang === "EN" ? "Something went wrong!" : "কিছু একটা সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  if (isOrderPlaced) {
    return (
      <div className="iframe-container">
        <div className="iframe-header" style={{ background: '#0b7a3e', padding: '15px' }}>
          <button onClick={() => setIsOrderPlaced(false)} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-white font-bold text-lg">{lang === "EN" ? "Deposit Info" : "ডিপোজিট তথ্য"}</span>
          <div></div>
        </div>
        
        <div className="iframe-content text-center pt-6">
          <h2 className="text-xl font-bold mb-6">{method}</h2>
          <h3 className="text-lg font-bold text-left mb-4">{lang === "EN" ? "Order placed" : "অর্ডার সম্পন্ন হয়েছে"}</h3>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-left">
              <p className="text-gray-500 text-sm">{lang === "EN" ? "Deposit account" : "ডিপোজিট একাউন্ট"}</p>
              <p className="font-bold text-lg">mdrashedul</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded" onClick={copyToClipboard}>{lang === "EN" ? "Copy" : "কপি"}</button>
          </div>
          
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <div className="text-left">
              <p className="text-gray-500 text-sm">{lang === "EN" ? "Deposit Amounts" : "ডিপোজিট এমাউন্ট"}</p>
              <p className="font-bold text-lg">৳ {amount}</p>
            </div>
            <button className="bg-blue-50 text-blue-500 px-4 py-2 rounded">{lang === "EN" ? "Copy" : "কপি"}</button>
          </div>

          {bonusPercent > 0 && (
            <>
              <div className="flex justify-between items-center mb-2 text-green-700 bg-green-50 p-3 rounded">
                <div className="text-left">
                  <p className="text-sm font-semibold">{lang === "EN" ? `Claimed Bonus (${bonusPercent}%)` : `ক্লেইমড বোনাস (${bonusPercent}%)`}</p>
                  <p className="font-bold text-lg">৳ {bonusAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 text-black bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-left">
                  <p className="text-sm font-semibold">{lang === "EN" ? "Total Amount (Deposit + Bonus)" : "সর্বমোট এমাউন্ট (ডিপোজিট + বোনাস)"}</p>
                  <p className="font-bold text-lg">৳ {totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}

          <div className="text-left text-sm text-gray-600 space-y-2">
            <p className="font-bold text-black">{lang === "EN" ? "Tips" : "নির্দেশনা"}</p>
            <p>{lang === "EN" ? "After the funds were transferred, kindly click on the 'complete deposit' button" : "টাকা পাঠানোর পর 'কমপ্লিট ডিপোজিট' বাটনে ক্লিক করুন।"}</p>
            <p className="mt-4">{lang === "EN" ? "-Feel free to contact us if you have any questions." : "-কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।"}</p>
            <a href="#" className="underline text-blue-600 font-semibold mt-2 block">{lang === "EN" ? "Customer Service" : "কাস্টমার সার্ভিস"}</a>
          </div>
        </div>

        <div className="bottom-bar">
          <button onClick={() => router.push('/wallets/voucher-report')} className="bottom-bar-btn btn-white-outline">{lang === "EN" ? "Transaction record" : "ট্রানজেকশন রেকর্ড"}</button>
          <button onClick={() => router.push('/')} className="bottom-bar-btn btn-blue">{lang === "EN" ? "Complete deposit" : "কমপ্লিট ডিপোজিট"}</button>
          <button onClick={() => window.location.reload()} className="bottom-bar-btn btn-white-outline">{lang === "EN" ? "Another" : "অন্য"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iframe-container">
      <div className="iframe-header">
        <div>
          <h1>{lang === "EN" ? `BDT ${amount}` : `বিডিটি ${amount}`}</h1>
          <p>{lang === "EN" ? "Don't over or under cash out." : "ক্যাশ আউটের চেয়ে বেশি বা কম দিবেন না।"}</p>
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
          {lang === "EN" ? `If you change the amount (BDT ${amount}), you won't get the credit` : `আপনি যদি এমাউন্ট পরিবর্তন করেন (বিডিটি ${amount}), তবে আপনি ক্রেডিট পাবেন না`}
        </div>

        <div className="bkash-card" style={{ backgroundColor: method.includes("Bkash") ? '#d10074' : '#f63' }}>
          <div className="bkash-logo">
            {logo ? <img src={logo} alt="logo" className="w-full h-full object-contain" /> : "Logo"}
          </div>
          <h2>{method} Deposit</h2>
        </div>

        <div className="wallet-label">{lang === "EN" ? "Wallet No*" : "ওয়ালেট নম্বর*"}</div>
        <div className="wallet-note">{lang === "EN" ? `This ${method} number only accepts Send Money.` : `এই ${method} নম্বরটি শুধুমাত্র সেন্ড মানি গ্রহণ করে।`}</div>
        <div className="wallet-box">
          <span>{walletNumber}</span>
          <span className="copy-btn" onClick={copyToClipboard}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </span>
        </div>

        {!isSubmitted ? (
          <>
            <div className="txn-label">{lang === "EN" ? "Transaction ID* (Required)" : "ট্রানজেকশন আইডি* (আবশ্যক)"}</div>
            
            {showModifyState ? (
              <div className="modify-input-box">
                <input type="text" value={txnId} readOnly />
                <button className="btn-modify" onClick={handleEditClick}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  {lang === "EN" ? "Modify" : "পরিবর্তন"}
                </button>
              </div>
            ) : (
              <input
                type="text"
                className="txn-input"
                placeholder={lang === "EN" ? "TrxID Required!" : "ট্রানজেকশন আইডি দিন!"}
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
              />
            )}

            <button 
              className="submit-btn" 
              onClick={showModifyState ? handleFinalSubmit : handleInitialSubmit}
            >
              {loading ? (lang === "EN" ? "Submitting..." : "সাবমিট হচ্ছে...") : (lang === "EN" ? "Submit" : "সাবমিট")}
            </button>
          </>
        ) : (
          <div className="success-mark">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <button className="submit-btn" style={{ borderColor: '#0b7a3e', color: '#0b7a3e', width: '80%' }} onClick={() => setIsOrderPlaced(true)}>
              {lang === "EN" ? "View Order Info" : "অর্ডারের তথ্য দেখুন"}
            </button>
          </div>
        )}

        <div className="warning-section">
          <h3>{lang === "EN" ? "Warning:" : "সতর্কতা:"}</h3>
          <div className="red-subtext">{lang === "EN" ? "Transaction ID must be filled in correctly, otherwise the score will fail!" : "ট্রানজেকশন আইডি সঠিকভাবে পূরণ করতে হবে, অন্যথায় স্কোর বাতিল হবে!"}</div>
          <p>{lang === "EN" ? `Please note that you make deposit to ${method} deposit. Be sure that you make the payment from the same wallet, otherwise it may be lost.` : `অনুগ্রহ করে মনে রাখবেন যে আপনি ${method} এ ডিপোজিট করছেন। একই ওয়ালেট থেকে পেমেন্ট করেছেন কিনা নিশ্চিত করুন, অন্যথায় এটি হারিয়ে যেতে পারে।`}</p>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{lang === "EN" ? "This order can only be submitted once, please confirm your Transaction ID: " : "এই অর্ডারটি শুধুমাত্র একবার সাবমিট করা যাবে, অনুগ্রহ করে আপনার ট্রানজেকশন আইডি নিশ্চিত করুন: "}<span>{txnId}</span> {lang === "EN" ? "is correct!" : "সঠিক আছে!"}</h3>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>{lang === "EN" ? "Cancel" : "বাতিল"}</button>
              <button className="btn-confirm" onClick={handleConfirmSubmit}>{lang === "EN" ? "নিশ্চিত" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box text-left">
            <h3 className="text-center font-bold text-xl mb-6">{lang === "EN" ? "Are you sure you want to change?" : "আপনি কি নিশ্চিত যে আপনি পরিবর্তন করতে চান?"}</h3>
            <div className="flex justify-center gap-4">
              <button className="btn-yes" onClick={() => { setShowEditConfirmModal(false); setShowModifyState(false); }}>
                {lang === "EN" ? "Yes" : "হ্যাঁ"}
              </button>
              <button className="btn-no" onClick={() => setShowEditConfirmModal(false)}>{lang === "EN" ? "No" : "না"}</button>
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
