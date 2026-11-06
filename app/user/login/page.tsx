"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // পেজ লোডিং অ্যানিমেশন (১ সেকেন্ড)
  useState(() => {
    const timer = setTimeout(() => setIsLoadingPage(false), 800);
    return () => clearTimeout(timer);
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // মোবাইল নম্বর চেক (১১ ডিজিট এবং ০১ দিয়ে শুরু)
    if (!/^01\d{9}$/.test(mobile)) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      setLoading(false);
      return;
    }

    // পাসওয়ার্ড চেক (মিনিমাম ৮ ডিজিট)
    if (password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    try {
      const { data, error: funcError } = await supabase.functions.invoke("auth-manager", {
        body: { action: "login", mobile, password },
      });

      if (funcError || data?.error) {
        throw new Error(data?.error || funcError?.message || "লগইন ব্যর্থ হয়েছে");
      }

      if (data?.session) {
        localStorage.setItem("supabase_session", JSON.stringify(data.session));
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingPage) {
    return (
      <div className="min-h-screen bg-[#0F212E] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2F4553] border-t-[#00E701] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F212E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#1A2C38] border border-[#2F4553] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Login</h1>

        {error && (
          <div className="bg-[#ED4163]/20 border border-[#ED4163] text-[#ED4163] text-sm p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Mobile Number</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E701] hover:bg-[#00c701] text-[#071A0B] font-bold text-sm py-2.5 rounded-md mt-2 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#071A0B] border-t-transparent rounded-full animate-spin"></div> : "Login"}
          </button>
        </form>

        <p className="text-[#B1BAD3] text-xs text-center mt-6">
          Don't have an account?{" "}
          <Link href="/user/signup" className="text-[#00E701] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
