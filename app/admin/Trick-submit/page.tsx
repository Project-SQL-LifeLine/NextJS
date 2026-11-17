"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function AdminTrickSubmitPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_messages");
    if (!error && data) {
      // ডিলিট করা মেসেজ বাদ দেওয়া
      setMessages(data.filter((m: any) => !m.is_deleted)); 
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();

    // রিয়েল-টাইম আপডেট (সব ধরনের ইভেন্টের জন্য)
    const subscription = supabase
      .channel("admin_support_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => { loadMessages(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: selectedUser,
      message: replyText.trim(),
      sender_type: "admin",
    });

    if (error) alert("রিপ্লাই পাঠানো যায়নি! এরর: " + error.message);
    else { setReplyText(""); setSelectedUser(null); loadMessages(); }
    setSending(false);
  };

  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    if (!acc[msg.user_id]) {
      acc[msg.user_id] = { user_id: msg.user_id, game_id: msg.game_id || "Unknown", mobile: msg.mobile || "No Phone", chat: [] };
    }
    acc[msg.user_id].chat.push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 font-sans pb-20">
      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-xl font-bold">Admin - Support Messages</h1>
      </div>

      {loading ? <div className="text-center py-10">Loading...</div> : Object.values(groupedMessages).length === 0 ? <div className="text-center py-10">কোনো মেসেজ নেই।</div> : (
        <div className="space-y-6">
          {Object.values(groupedMessages).map((userChat: any) => (
            <div key={userChat.user_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">Game ID: {userChat.game_id}</h3>
                  <p className="text-xs text-gray-500">Mobile: {userChat.mobile}</p>
                </div>
                <button onClick={() => setSelectedUser(userChat.user_id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Reply</button>
              </div>

              <div className="p-4 space-y-3 max-h-60 overflow-y-auto bg-gray-50/50">
                {userChat.chat.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-sm ${
                      msg.sender_type === "admin" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                    } ${msg.is_hidden ? "opacity-50" : ""}`}>
                      <p>{msg.message} {msg.is_hidden && "(Hidden)"}</p>
                      <span className={`text-[10px] mt-1 block ${msg.sender_type === "admin" ? "text-blue-200 text-right" : "text-gray-400 text-left"}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUser === userChat.user_id && (
                <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                  <button onClick={sendReply} disabled={sending || !replyText.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{sending ? "..." : "Send"}</button>
                  <button onClick={() => setSelectedUser(null)} className="text-gray-500 px-2 hover:text-gray-800">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
