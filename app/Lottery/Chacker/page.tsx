"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function TicketCheckerPage() {
  const router = useRouter();
  
  const [ticketNumber, setTicketNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [showScanner, setShowScanner] = useState(false);

  // ==========================================
  // সার্চ বা স্ক্যান করে ডাটা বের করার ফাংশন
  // ==========================================
  const checkTicket = async (numberToCheck: string) => {
    // ১২ ডিজিটের না হলে বা খালি থাকলে কিছুই করবে না
    if (!numberToCheck || numberToCheck.length < 10) {
      setErrorMsg("অনুগ্রহ করে সঠিক ১২ ডিজিটের টিকিট নাম্বার দিন।");
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMsg("");
    setShowScanner(false); // স্ক্যানার বন্ধ করে দেবে

    try {
      // ডাটাবেস থেকে টিকিট চেক করা (ticket_transactions টেবিল)
      const { data, error } = await supabase
        .from("ticket_transactions")
        .select("*")
        .eq("ticket_number", numberToCheck)
        .eq("transaction_type", "ticket_purchase")
        .eq("status", "approved")
        .single();

      if (error || !data) {
        // টিকিট না পাওয়া গেলে
        setErrorMsg("❌ এই টিকিটটি আমাদের ডাটাবেসে পাওয়া যায়নি। এটি নকল হতে পারে!");
      } else {
        // টিকিট পাওয়া গেলে
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // বারকোড স্ক্যানার লজিক
  // ==========================================
  useEffect(() => {
    if (showScanner) {
      // স্ক্যানার ইনিশিয়ালাইজ
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 150 } }, // বারকোডের জন্য রেক্ট্যাঙ্গেল শেপ
        /* verbose= */ false
      );

      // স্ক্যান সফল হলে
      const onScanSuccess = (decodedText: string) => {
        scanner.clear(); // স্ক্যানার বন্ধ
        setTicketNumber(decodedText);
        checkTicket(decodedText); // অটোমেটিক সার্চ
      };

      scanner.render(onScanSuccess, (error) => {
        // স্ক্যান এরর ইগনোর করবে
      });

      // ক্লিনআপ ফাংশন
      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [showScanner]);

  return (
    <div className="min-h-screen bg-[#0b1a13] text-white p-4 pb-20 font-sans">
      
      {/* হেডার */}
      <div className="flex items-center gap-4 mb-6 mt-2">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-wide">Ticket Checker</h1>
      </div>

      {/* ইনপুট এবং স্ক্যান বাটন */}
      <div className="bg-[#103626] p-5 rounded-2xl border border-white/10 shadow-lg mb-6">
        <label className="text-xs text-[#A0ADB0] mb-2 block">Enter 12-Digit Ticket Number</label>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-[#0b1a13] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa]"
              placeholder="e.g. 2152 2618 4808"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              maxLength={15} // স্পেস সহ
            />
          </div>
          
          <button
            onClick={() => setShowScanner(true)}
            className="bg-[#184f35] hover:bg-[#1f6343] border border-[#2e9b4a] px-4 rounded-xl flex items-center justify-center transition-colors"
            title="Scan Barcode"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="3" height="10"></rect>
              <rect x="12" y="7" width="2" height="10"></rect>
              <rect x="16" y="7" width="1" height="10"></rect>
            </svg>
          </button>
        </div>

        <button
          onClick={() => checkTicket(ticketNumber.replace(/\s/g, ''))}
          disabled={loading}
          className="w-full mt-4 bg-[#00ffaa] text-[#0b1a13] font-bold py-3 rounded-xl hover:bg-[#00e699] transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Check Ticket"}
        </button>
      </div>

      {/* স্ক্যানার কন্টেইনার */}
      {showScanner && (
        <div className="mb-6 rounded-2xl overflow-hidden border-2 border-[#00ffaa] bg-black">
          <div className="bg-[#184f35] p-2 text-center text-sm text-white flex justify-between items-center">
            <span>Scanning Barcode...</span>
            <button onClick={() => setShowScanner(false)} className="text-red-400 font-bold px-2">Close</button>
          </div>
          <div id="reader" className="w-full"></div>
        </div>
      )}

      {/* এরর মেসেজ */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center text-sm font-semibold mb-6">
          {errorMsg}
        </div>
      )}

      {/* রেজাল্ট কার্ড */}
      {result && (
        <div className="bg-gradient-to-br from-[#184f35] to-[#0b1a13] border border-[#2e9b4a] p-6 rounded-2xl shadow-[0_0_20px_rgba(46,155,74,0.2)] relative overflow-hidden">
          
          {/* ওয়াটারমার্ক */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/5 text-6xl font-black rotate-12 pointer-events-none">
            VERIFIED
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[#00ffaa] font-black text-xl mb-1 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                REAL TICKET
              </h2>
              <p className="text-xs text-gray-400">This ticket is authentic and valid.</p>
            </div>
            <div className="bg-[#00ffaa] text-[#0b1a13] px-3 py-1 rounded-full text-xs font-bold">
              APPROVED
            </div>
          </div>

          <div className="space-y-3 text-sm border-t border-white/10 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Ticket Number:</span>
              <span className="font-mono font-bold text-white tracking-widest">
                {result.ticket_number.match(/.{1,4}/g)?.join("  ") || result.ticket_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ticket Tier:</span>
              <span className="font-bold text-[#F5B041]">৳ {result.ticket_tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Purchase Date:</span>
              <span className="text-white">
                {new Date(result.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID:</span>
              <span className="text-white font-mono text-xs">{result.id.split('-')[0]}...</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
