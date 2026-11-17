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

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // ইউজার লগইন না থাকলে লগইন পেজে পাঠান
        router.push("/login"); 
        return;
      }

      setUserId(session.user.id);
      await loadMessages(session.user.id);
      setLoading(false);

      // রিয়েল-টাইম আপডেট (অ্যাডমিন মেসেজ দিলে সাথে সাথে দেখা যাবে)
      const subscription = supabase
        .channel("public:support_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            setMessages((prev) => {
              // ডুপ্লিকেট মেসেজ আটকানোর জন্য
              if (prev.find((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    fetchUserAndMessages();
  }, [router]);

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
    if (!newMessage.trim()) return;
    if (!userId) {
      alert("ইউজার সেশন পাওয়া যায়নি। আবার লগইন করুন।");
      return;
    }

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage(""); 

    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: msgText,
      sender_type: "user",
    });

    if (error) {
      console.error("Error sending message:", error);
      alert("মেসেজ পাঠানো যায়নি! এরর: " + error.message);
      setNewMessage(msgText); // এরর হলে মেসেজ ফেরত আনা
    }
    
    setSending(false);
  };

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
    <div className="min-h-screen bg-[#0b1a13] text-white font-sans flex flex-col">
      
      {/* হেডার (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 p-4 bg-[#103626] border-b border-white/10 shadow-md h-[72px]">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-wide">Trick Submit</h1>
        </div>
      </div>

      {/* চ্যাট এরিয়া */}
      <div className="flex-1 overflow-y-auto pt-[88px] pb-[90px] px-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm px-4">
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

      {/* মেসেজ ইনপুট এরিয়া (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#103626] border-t border-white/10 pb-safe z-50">
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
