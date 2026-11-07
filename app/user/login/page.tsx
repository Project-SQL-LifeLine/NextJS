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
      <div className="min-h-screen bg-[#07110f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#26352e] border-t-[#00e701] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07110f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111d19] border border-[#26352e] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Login</h1>

        {error && (
          <div className="bg-[#ED4163]/20 border border-[#ED4163] text-[#ED4163] text-sm p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[#9ca9a3] text-xs font-semibold mb-1 block">Game ID / Number</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              required
              className="w-full bg-[#07110f] text-white border border-[#26352e] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e701]"
            />
          </div>

          <div>
            <label className="text-[#9ca9a3] text-xs font-semibold mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#07110f] text-white border border-[#26352e] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e701]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#07110f] font-bold text-sm py-2.5 rounded-md mt-2 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#07110f] border-t-transparent rounded-full animate-spin"></div> : "Login"}
          </button>
        </form>

        <p className="text-[#9ca9a3] text-xs text-center mt-6">
          Don't have an account?{" "}
          <Link href="/user/signup" className="text-[#00e701] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
