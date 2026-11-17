"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; // আপনার পাথ অনুযায়ী ঠিক করে নিন

export default function TrickSubmitPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // ১. ইউজার লগইন চেক এবং মেসেজ লোড করা
  // ==========================================
  useEffect(() => {
    const fetchUserAndMessages = async () => {
      // ইউজার লগইন করা আছে কিনা চেক করা
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // লগইন না থাকলে লগইন পেজে পাঠিয়ে দিন (আপনার প্রজেক্টের লগইন পাথ দিন)
        router.push("/login"); 
        return;
      }

      setUserId(session.user.id);
      await loadMessages(session.user.id);
      setLoading(false);

      // রিয়েল-টাইম সাবস্ক্রিপশন (যদি অ্যাডমিন উত্তর দেয়, সাথে সাথে দেখাবে)
      const subscription = supabase
        .channel("public:support_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    fetchUserAndMessages();
  }, [router]);

  // মেসেজ লোড করার ফাংশন
  const loadMessages = async (uid: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  // ==========================================
  // ২. নতুন মেসেজ পাঠানোর ফাংশন
  // ==========================================
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage(""); // ইনপুট খালি করা

    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: msgText,
      sender_type: "user",
    });

    if (error) {
      alert("মেসেজ পাঠানো যায়নি! আবার চেষ্টা করুন।");
      setNewMessage(msgText); // এরর হলে মেসেজটি ফেরত আনা
    }
    
    setSending(false);
    // অটো স্ক্রল নিচে
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ইউজার মেসেজ পাঠালে বা অ্যাডমিন মেসেজ দিলে অটো স্ক্রল
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1a13] flex items-center justify-center text-[#00ffaa]">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1a13] text-white flex flex-col font-sans">
      
      {/* হেডার */}
      <div className="flex items-center gap-4 p-4 bg-[#103626] border-b border-white/10 shadow-md">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-wide">Admin Support</h1>
          <p className="text-xs text-[#00ffaa] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse"></span> Online
          </p>
        </div>
      </div>

      {/* চ্যাট এরিয়া */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">
            আপনার কোনো সমস্যা বা ট্রিক সাবমিট করতে চাইলে এখানে মেসেজ দিন। অ্যাডমিন শীঘ্রই উত্তর দেবে।
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender_type === "user"
                    ? "bg-[#00ffaa] text-[#0b1a13] rounded-tr-sm"
                    : "bg-[#184f35] border border-white/10 text-white rounded-tl-sm"
                }`}
              >
                <p>{msg.message}</p>
                <span className={`text-[10px] mt-1 block ${msg.sender_type === "user" ? "text-[#0b1a13]/70 text-right" : "text-gray-400 text-left"}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* মেসেজ ইনপুট এরিয়া (ফিক্সড) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#103626] border-t border-white/10 pb-safe">
        <div className="max-w-md mx-auto flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-[#0b1a13] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa] resize-none max-h-32 min-h-[44px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-[#00ffaa] text-[#0b1a13] p-3 rounded-xl hover:bg-[#00e699] transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
