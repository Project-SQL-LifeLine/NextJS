"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; // পাথ চেক করুন

export default function TrickSubmitPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // এডিট এবং হাইড স্টেট
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [optionsMenuId, setOptionsMenuId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/login");
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);
      
      await loadMessages(currentUserId);
      setLoading(false);

      // রিয়েল-টাইম আপডেট (ফিল্টার ছাড়া সব আপডেট নিবে, পরে ফিল্টার করব)
      const subscription = supabase
        .channel("support_chat_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_messages" }, // INSERT, UPDATE, DELETE সব ধরবে
          (payload) => {
            loadMessages(currentUserId); // যেকোনো পরিবর্তনে লিস্ট রিলোড হবে
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
      .eq("is_deleted", false) // ডিলিট করা মেসেজ দেখাবে না
      .order("created_at", { ascending: true });

    if (!error && data) {
      // হাইড করা মেসেজ ফিল্টার করা
      const visibleMessages = data.filter(msg => !msg.is_hidden || msg.sender_type === 'admin');
      setMessages(visibleMessages);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage(""); 

    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: msgText,
      sender_type: "user",
    });

    if (error) {
      alert("মেসেজ পাঠানো যায়নি! এরর: " + error.message);
      setNewMessage(msgText); 
    }
    setSending(false);
  };

  // এডিট সেভ করা
  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await supabase.from("support_messages").update({ message: editText }).eq("id", msgId);
    setEditingId(null);
    loadMessages(userId!);
  };

  // ডিলিট করা
  const handleDelete = async (msgId: string) => {
    if (confirm("আপনি কি এই মেসেজটি ডিলিট করতে চান?")) {
      await supabase.from("support_messages").update({ is_deleted: true }).eq("id", msgId);
      loadMessages(userId!);
    }
  };

  // হাইড/আনহাইড করা
  const handleHide = async (msgId: string, currentStatus: boolean) => {
    await supabase.from("support_messages").update({ is_hidden: !currentStatus }).eq("id", msgId);
    loadMessages(userId!);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <div className="min-h-screen bg-[#0b1a13] flex items-center justify-center text-[#00ffaa]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0b1a13] text-white font-sans flex flex-col" onClick={() => setOptionsMenuId(null)}>
      
      {/* হেডার */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 p-4 bg-[#103626] border-b border-white/10 shadow-md h-[72px]">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-lg font-bold tracking-wide">Trick Submit</h1>
      </div>

      {/* চ্যাট এরিয়া */}
      <div className="flex-1 overflow-y-auto pt-[88px] pb-[90px] px-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender_type === "user" ? "items-end" : "items-start"}`}>
            
            {/* মেসেজ বাবল */}
            <div className="relative max-w-[80%]">
              <div
                onClick={(e) => {
                  if (msg.sender_type === "user") {
                    e.stopPropagation();
                    setOptionsMenuId(optionsMenuId === msg.id ? null : msg.id);
                  }
                }}
                className={`p-3 rounded-2xl text-sm cursor-pointer ${
                  msg.sender_type === "user"
                    ? "bg-[#00ffaa] text-[#0b1a13] rounded-tr-sm"
                    : "bg-[#184f35] border border-white/10 text-white rounded-tl-sm"
                }`}
              >
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-white/50 text-black px-2 py-1 rounded text-sm w-full"
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button onClick={() => setEditingId(null)} className="text-red-700">Cancel</button>
                      <button onClick={() => handleSaveEdit(msg.id)} className="text-green-800 font-bold">Save</button>
                    </div>
                  </div>
                ) : (
                  <p>{msg.message}</p>
                )}
                <span className={`text-[10px] mt-1 block ${msg.sender_type === "user" ? "text-[#0b1a13]/70 text-right" : "text-gray-400 text-left"}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {msg.is_hidden && " (Hidden)"}
                </span>
              </div>

              {/* অপশন মেনু */}
              {optionsMenuId === msg.id && msg.sender_type === "user" && (
                <div className="absolute top-full right-0 mt-1 bg-[#103626] border border-white/20 rounded-lg shadow-lg flex overflow-hidden z-50">
                  <button onClick={() => { setEditingId(msg.id); setEditText(msg.message); setOptionsMenuId(null); }} className="px-3 py-2 text-xs hover:bg-white/10 border-r border-white/10 text-blue-400">Edit</button>
                  <button onClick={() => { handleHide(msg.id, msg.is_hidden); setOptionsMenuId(null); }} className="px-3 py-2 text-xs hover:bg-white/10 border-r border-white/10 text-yellow-400">{msg.is_hidden ? "Unhide" : "Hide"}</button>
                  <button onClick={() => { handleDelete(msg.id); setOptionsMenuId(null); }} className="px-3 py-2 text-xs hover:bg-white/10 text-red-400">Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ইনপুট এরিয়া */}
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
          <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-[#00ffaa] text-[#0b1a13] p-3 rounded-xl hover:bg-[#00e699] transition-colors disabled:opacity-50 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
