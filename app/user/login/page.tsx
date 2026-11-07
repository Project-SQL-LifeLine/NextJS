"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  
  const [gameId, setGameId] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // useEffect ব্যবহার করা হয়েছে (useState এর ভেতরে টাইমার কাজ করে না)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingPage(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!gameId || !password) {
      setError("সবগুলো ঘর পূরণ করুন");
      setLoading(false);
      return;
    }

    try {
      const { data, error: funcError } = await supabase.functions.invoke("auth-manager", {
        body: { action: "login", game_id: gameId, password },
      });

      if (funcError || data?.error) {
        throw new Error(data?.error || funcError?.message || "লগইন ব্যর্থ হয়েছে");
      }

      // সেশন সেভ করার সঠিক নিয়ম (Supabase ক্লায়েন্টে সেট করা)
      if (data?.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (sessionError) throw sessionError;
      }

      router.push("/");
      router.refresh(); // হোমপেজে গিয়ে নতুন করে সেশন চেক করার জন্য
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#18221E" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#263C32", borderTopColor: "#00E701" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#18221E" }}>
      
      {/* কার্ড সেকশন */}
      <div 
        className="w-full max-w-sm rounded-xl shadow-lg"
        style={{ 
          backgroundColor: "#1B2A23", 
          border: "1px solid #263C32", 
          padding: "24px 20px" 
        }}
      >
        <h1 className="text-xl font-bold text-white text-center mb-5">Login to your account</h1>

        {error && (
          <div 
            className="text-sm p-2 rounded mb-4 text-center"
            style={{ background: "rgba(255, 77, 77, 0.1)", color: "#ff4d4d", border: "1px solid rgba(255, 77, 77, 0.3)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Mobile Number / Game ID</label>
            <div 
              className="flex items-center px-3 rounded-lg"
              style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}
            >
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter mobile number or Game ID"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Password</label>
            <div 
              className="flex items-center px-3 rounded-lg"
              style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}
            >
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#A0ADB0" }}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold text-sm py-2.5 rounded-lg mt-2 transition-colors disabled:opacity-50 flex justify-center items-center"
            style={{ backgroundColor: "#00E701", color: "#000", height: "44px" }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                LOGIN
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: "#A0ADB0" }}>
          Don't have an account?{" "}
          <Link href="/user/signup" className="font-semibold hover:underline" style={{ color: "#00E701" }}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
