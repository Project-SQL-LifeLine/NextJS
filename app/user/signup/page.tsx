"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  
  const [formData, setFormData] = useState({
    game_id: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useState(() => {
    const timer = setTimeout(() => setIsLoadingPage(false), 800);
    return () => clearTimeout(timer);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ১. মোবাইল ভ্যালিডেশন (১১ ডিজিট, শুরুতে ০১)
    if (!/^01\d{9}$/.test(formData.mobile)) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      setLoading(false);
      return;
    }

    // ২. পাসওয়ার্ড ম্যাচিং চেক
    if (formData.password !== formData.confirmPassword) {
      setError("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না");
      setLoading(false);
      return;
    }

    // ৩. পাসওয়ার্ড ভ্যালিডেশন (মিনিমাম ৮ ডিজিট)
    if (formData.password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    // ৪. ইউজারনেম ভ্যালিডেশন (মিনিমাম ৮ ডিজিট)
    if (formData.game_id.length < 8) {
      setError("ইউজারনেম কমপক্ষে ৮ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    try {
      // ৫. ইউজারনেম (Game ID) আগে থেকে আছে কি না চেক করা
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("game_id")
        .eq("game_id", formData.game_id)
        .single();

      if (existingUser) {
        setError("এই ইউজারনেমটি আগেই নেওয়া হয়েছে, অন্য নাম দিন");
        setLoading(false);
        return;
      }

      // ৬. Edge Function এ রিকোয়েস্ট পাঠানো
      const { data, error: funcError } = await supabase.functions.invoke("auth-manager", {
        body: {
          action: "signup",
          game_id: formData.game_id,
          mobile: formData.mobile,
          password: formData.password,
        },
      });

      if (funcError || data?.error) {
        throw new Error(data?.error || funcError?.message || "সাইনআপ ব্যর্থ হয়েছে");
      }

      router.push("/user/login");
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
    <div className="min-h-screen bg-[#0F212E] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-[#1A2C38] border border-[#2F4553] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Register</h1>

        {error && (
          <div className="bg-[#ED4163]/20 border border-[#ED4163] text-[#ED4163] text-sm p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Username</label>
            <input
              type="text"
              name="game_id"
              value={formData.game_id}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <div>
            <label className="text-[#B1BAD3] text-xs font-semibold mb-1 block">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
              className="w-full bg-[#0F212E] text-white border border-[#2F4553] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E701]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E701] hover:bg-[#00c701] text-[#071A0B] font-bold text-sm py-2.5 rounded-md mt-2 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#071A0B] border-t-transparent rounded-full animate-spin"></div> : "Register"}
          </button>
        </form>

        <p className="text-[#B1BAD3] text-xs text-center mt-6">
          Already have an account?{" "}
          <Link href="/user/login" className="text-[#00E701] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
