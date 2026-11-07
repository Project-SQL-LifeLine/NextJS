"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import { useLanguage } from "../../../../lib/LanguageContext";

export default function AddBankCardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [methodCode, setMethodCode] = useState("bkash");
  const [fullName, setFullName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // কনফার্মেশন পপআপ
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const methods = [
    { id: "bkash", name: "bKash", color: "#D12053", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png" },
    { id: "nagad", name: "Nagad", color: "#F63", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nagad_Logo.svg/512px-Nagad_Logo.svg.png" },
    { id: "rocket", name: "Rocket", color: "#8C3494", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Rocket_Logo.svg/512px-Rocket_Logo.svg.png" },
    { id: "bkash_send", name: "Send Money bKash", color: "#D12053", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bkash_Logo.svg/512px-Bkash_Logo.svg.png" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^01[0-9]{9}$/.test(accountNumber)) {
      setError(t("Please enter a valid 11 digit mobile number.", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।"));
      return;
    }
    if (password.length < 6) {
      setError(t("Password must be at least 6 characters.", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("Passwords do not match.", "পাসওয়ার্ড মিলছে না।"));
      return;
    }

    // কনফার্মেশন পপআপ দেখানো
    setShowConfirmModal(true);
  };

  const saveToDatabase = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // ১. user_payment_type_store এ সেভ করা
      const { error: insertError } = await supabase.from("user_payment_type_store").insert({
        user_id: session.user.id,
        method_code: methodCode === "bkash_send" ? "bkash" : methodCode, // Send Money হলেও bkash ই ধরা হবে
        account_number: accountNumber,
        account_name: fullName
      });

      if (insertError) throw new Error("Payment Method Save Error: " + insertError.message);

      // ২. profiles এ ট্রানজেকশন পাসওয়ার্ড আপডেট করা
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ transaction_password: password })
        .eq("id", session.user.id);

      if (updateError) throw new Error("Password Update Error: " + updateError.message);

      // সফল হলে withdrawal পেজে ফিরে যাবে
      router.push("/wallets/withdrawal");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("Failed to save data.", "তথ্য সেভ করতে সমস্যা হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-[#0A2C6B] px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-white">{t("Link E-wallet", "ই-ওয়ালেট লিংক করুন")}</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4">
        {/* E-wallet group */}
        <h3 className="text-gray-600 text-sm mb-3">{t("Select E-wallet group", "ই-ওয়ালেট গ্রুপ নির্বাচন করুন")}</h3>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethodCode(m.id)}
              className={`relative bg-white p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                methodCode === m.id ? "border-red-500" : "border-gray-200"
              }`}
            >
              <img src={m.logo} alt={m.name} className="h-8 object-contain mb-1" />
              <span className={`text-[10px] font-bold text-center leading-tight ${methodCode === m.id ? "text-red-500" : "text-gray-600"}`}>
                {m.name}
              </span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm mb-3">{t("E-wallet type", "ই-ওয়ালেট টাইপ")}</h3>
          
          <div className="mb-4">
            <div className="inline-block border border-red-300 bg-red-50 text-black px-6 py-2 rounded-lg font-bold text-sm">
              {methods.find(m => m.id === methodCode)?.name}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center bg-[#F0F2F5] rounded-lg p-3">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Enter your full legal name", "আপনার পূর্ণ নাম লিখুন")}
                className="bg-transparent flex-1 outline-none text-black text-sm"
                required
              />
            </div>

            <p className="text-red-600 text-xs font-semibold leading-tight">
              {t("Please ensure the name you provide matches exactly with the name registered with your financial provider to avoid failure. Once the name is submitted, it cannot be changed.", "অনুগ্রহ করে নিশ্চিত করুন যে আপনি যে নামটি দিচ্ছেন তা আপনার আর্থিক প্রতিষ্ঠানে নিবন্ধিত নামের সাথে হুবহু মিলে। একবার সাবমিট হলে নাম পরিবর্তন করা যাবে না।")}
            </p>

            <div className="flex items-center bg-[#F0F2F5] rounded-lg p-3">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t(`Please fill in ${methods.find(m => m.id === methodCode)?.name} account number`, `${methods.find(m => m.id === methodCode)?.name} একাউন্ট নম্বর দিন`)}
                className="bg-transparent flex-1 outline-none text-black text-sm"
                required
              />
            </div>

            <h3 className="text-red-500 text-sm font-bold mt-2">{t("Please set up your transaction password.", "অনুগ্রহ করে আপনার ট্রানজেকশন পাসওয়ার্ড সেট করুন।")}</h3>
            
            <div className="flex items-center bg-[#F0F2F5] rounded-lg p-3">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Set transaction password", "ট্রানজেকশন পাসওয়ার্ড সেট করুন")}
                className="bg-transparent flex-1 outline-none text-black text-sm"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>

            <div className="flex items-center bg-[#F0F2F5] rounded-lg p-3">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")}
                className="bg-transparent flex-1 outline-none text-black text-sm"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D12053] hover:bg-[#b01a44] text-white font-bold text-lg py-3 rounded-lg mt-2 transition-colors flex justify-center items-center"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t("Submit", "সাবমিট")}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Popup */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl text-black mb-4">{t("Confirmation", "কনফার্মেশন")}</h2>
            
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>{t("Bank account name:", "ব্যাংক একাউন্টের নাম:")}</span>
                <span className="font-bold text-black uppercase">{fullName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>{methods.find(m => m.id === methodCode)?.name}:</span>
                <span className="font-bold text-black">{accountNumber}</span>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 font-semibold">
                {t("Cancel", "বাতিল")}
              </button>
              <button onClick={saveToDatabase} className="text-[#007BFF] font-bold">
                {t("OK", "ঠিক আছে")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
