"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; 
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // সিকিউরিটি স্টেট
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/user/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          router.replace("/");
          return;
        }

        const isPinVerified = sessionStorage.getItem("admin_pin_verified");
        
        if (isPinVerified === "true") {
          setIsAuthorized(true);
        } else {
          setShowPinScreen(true);
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setPinError("");

    try {
      const { data: isCorrect, error } = await supabase.rpc("verify_admin_pin", {
        input_pin: pin,
      });

      if (error) throw error;

      if (isCorrect) {
        sessionStorage.setItem("admin_pin_verified", "true");
        setIsAuthorized(true);
        setShowPinScreen(false);
      } else {
        setPinError("ভুল পিন! আবার চেষ্টা করুন।");
      }
    } catch (err) {
      setPinError("সার্ভার এরর! আবার চেষ্টা করুন।");
    } finally {
      setVerifying(false);
    }
  };

  // ১. লোডিং স্ক্রিন
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4 font-bold text-sm tracking-widest">CHECKING ACCESS...</p>
      </div>
    );
  }

  // ২. পিন স্ক্রিন
  if (showPinScreen) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Admin Security</h2>
          <p className="text-sm text-gray-500 mb-6">অ্যাডমিন প্যানেলে ঢুকতে ৬ ডিজিটের পিন দিন</p>

          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-center text-2xl tracking-[0.5em] rounded-lg py-3 mb-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              maxLength={6}
              required
            />
            {pinError && <p className="text-red-500 text-xs mb-3 font-semibold">{pinError}</p>}
            
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Unlock Panel"}
            </button>
          </form>
          
          <button 
            onClick={() => router.push("/")}
            className="mt-4 text-xs text-gray-400 hover:text-gray-800 font-semibold"
          >
            Back to Site
          </button>
        </div>
      </div>
    );
  }

  // ৩. মূল অ্যাডমিন প্যানেল (কম্পোনেন্ট দিয়ে সাজানো)
  if (isAuthorized) {
    return (
      <div className="h-screen bg-white flex font-sans text-gray-800 overflow-hidden w-full">
        
        {/* সাইডবার কম্পোনেন্ট */}
        <AdminSidebar pathname={pathname} isSidebarOpen={isSidebarOpen} />

        {/* মেইন কন্টেন্ট এরিয়া */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
          
          {/* হেডার কম্পোনেন্ট */}
          <AdminHeader setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

          {/* চিলড্রেন রেন্ডার */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
            {children}
          </main>

        </div>
      </div>
    );
  }

  return null; 
}
