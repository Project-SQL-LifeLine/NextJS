"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref"); // রেফারেল কোড রিসিভ করা হলো

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  
  const [formData, setFormData] = useState({
    game_id: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingPage(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ১. মোবাইল ভ্যালিডেশন (১১ ডিজিট, শুরুতে ০১)
    if (!/^01\d{9}$/.test(formData.mobile)) {
      setError("Please enter a valid 11 digit mobile number (e.g. 017XXXXXXXX).");
      setLoading(false);
      return;
    }

    // ২. পাসওয়ার্ড ম্যাচিং চেক
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // ৩. পাসওয়ার্ড ভ্যালিডেশন (মিনিমাম ৮ ডিজিট)
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    // ৪. ইউজারনেম ভ্যালিডেশন (মিনিমাম ৮ ডিজিট)
    if (formData.game_id.length < 8) {
      setError("Username must be at least 8 characters long.");
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
        setError("Wrong user or password. Username already taken.");
        setLoading(false);
        return;
      }

      // ৬. Edge Function এ রিকোয়েস্ট পাঠানো (রেফারেল কোডসহ)
      const { data, error: funcError } = await supabase.functions.invoke("auth-manager", {
        body: {
          action: "signup",
          game_id: formData.game_id,
          mobile: formData.mobile,
          password: formData.password,
          ref: refCode // রেফারেল কোড পাঠানো হলো
        },
      });

      if (funcError || data?.error) {
        throw new Error(data?.error || funcError?.message || "Signup failed. Wrong user or password.");
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#18221E" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#263C32", borderTopColor: "#00E701" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: "#18221E" }}>
      
      <div 
        className="w-full max-w-sm rounded-xl shadow-lg"
        style={{ backgroundColor: "#1B2A23", border: "1px solid #263C32", padding: "24px 20px" }}
      >
        <h1 className="text-xl font-bold text-white text-center mb-5">Register</h1>

        {error && (
          <div 
            className="text-sm p-2 rounded mb-4 text-center"
            style={{ background: "rgba(255, 77, 77, 0.1)", color: "#ff4d4d", border: "1px solid rgba(255, 77, 77, 0.3)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          
          {/* Username */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Username</label>
            <div className="flex items-center px-3 rounded-lg" style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}>
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                name="game_id"
                value={formData.game_id}
                onChange={handleChange}
                placeholder="Min 8 characters"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Mobile Number</label>
            <div className="flex items-center px-3 rounded-lg" style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}>
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Password</label>
            <div className="flex items-center px-3 rounded-lg" style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}>
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#A0ADB0" }}>
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#A0ADB0" }}>Confirm Password</label>
            <div className="flex items-center px-3 rounded-lg" style={{ backgroundColor: "#121816", border: "1px solid #263C32", height: "42px" }}>
              <svg className="w-4 h-4 mr-2" style={{ color: "#A0ADB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="w-full bg-transparent border-none outline-none text-white text-sm"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#A0ADB0" }}>
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
              <>REGISTER<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
            )}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: "#A0ADB0" }}>
          Already have an account? <Link href="/user/login" className="font-semibold hover:underline" style={{ color: "#00E701" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "#18221E" }}></div>}>
      <SignupForm />
    </Suspense>
  );
}
