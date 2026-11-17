"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

export default function TrickSubmitPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      // ১. সেশন থেকে ইউজার আইডি নেওয়ার চেষ্টা
      const { data: { session } } = await supabase.auth.getSession();
      let uid = session?.user?.id;

      // ২. যদি সেশন না থাকে, তবে লোকাল স্টোরেজ থেকে নেওয়ার চেষ্টা (আপনার কাস্টম লগইন)
      if (!uid) {
        const localData = localStorage.getItem("user") || localStorage.getItem("session");
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            uid = parsed.id || parsed.user?.id;
          } catch (e) {}
        }
      }

      // ৩. যদি এখনো না পাওয়া যায়, তবে একটি ডামি আইডি ব্যবহার করা হবে (শুধু টেস্টিং এর জন্য)
      if (!uid) {
        // দয়া করে এখানে আপনার ডাটাবেসের একটি রিয়েল user_id (UUID) বসান
        uid = "11111111-1111-1111-1111-111111111111"; 
      }

      setUserId(uid);
      await loadMessages(uid);
      setLoading(false);

      // রিয়েল-টাইম আপডেট
      const subscription = supabase
        .channel("custom_support_chat")
        .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
          loadMessages(uid);
        })
        .subscribe();

      return () => { supabase.removeChannel(subscription); };
    };

    fetchMessages();
  }, []);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
    
    const msgText = newMessage.trim();
    setNewMessage(""); 

    // সরাসরি ডাটাবেসে মেসেজ পাঠানো
    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: msgText,
      sender_type: "user",
    });

    if (error) {
      alert("মেসেজ পাঠানো যায়নি! কারণ: " + error.message);
      setNewMessage(msgText); 
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <div className="min-h-screen bg-[#0b1a13] flex items-center justify-center text-[#00ffaa]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0b1a13] text-white font-sans flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 p-4 bg-[#103626] border-b border-white/10 shadow-md h-[72px]">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-lg font-bold tracking-wide">Trick Submit</h1>
      </div>

      <div className="flex-1 overflow-y-auto pt-[88px] pb-[90px] px-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.sender_type === "user" ? "bg-[#00ffaa] text-[#0b1a13] rounded-tr-sm" : "bg-[#184f35] border border-white/10 text-white rounded-tl-sm"
              }`}>
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#103626] border-t border-white/10 pb-safe z-50">
        <div className="max-w-md mx-auto flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-[#0b1a13] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa] resize-none max-h-32 min-h-[44px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />
          <button onClick={sendMessage} className="bg-[#00ffaa] text-[#0b1a13] p-3 rounded-xl hover:bg-[#00e699] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
