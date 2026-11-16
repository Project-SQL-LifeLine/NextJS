"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; // আপনার পাথ অনুযায়ী চেক করুন
import LotteryHeader from "../Lottery/Header/Header";
import LotteryFooter from "../Lottery/Footer/Footer";
import "./notification.css";

export default function NotificationPage() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) setProfile(profileData);

        const { data, error } = await supabase
          .from("user_notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch Error:", error.message);
        } else if (data) {
          const readBroadcasts = JSON.parse(localStorage.getItem("read_broadcast_notifs") || "[]");

          const myNotifications = data.filter((notif) => {
            const isActive = notif.status === 'active' || notif.status === null;
            const isForMe = notif.user_id === user.id || notif.user_id === null;
            
            if (!isActive || !isForMe) return false;

            if (notif.user_id === null && readBroadcasts.includes(notif.id)) {
              notif.is_read = true;
            }

            return true;
          });
          
          setNotifications(myNotifications);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRead = async (notif: any) => {
    if (!notif.is_read) {
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      
      if (notif.user_id) {
        await supabase.from("user_notifications").update({ is_read: true }).eq("id", notif.id);
      } else {
        const readBroadcasts = JSON.parse(localStorage.getItem("read_broadcast_notifs") || "[]");
        if (!readBroadcasts.includes(notif.id)) {
          readBroadcasts.push(notif.id);
          localStorage.setItem("read_broadcast_notifs", JSON.stringify(readBroadcasts));
        }
      }
    }
  };

  // ৯ শব্দের বেশি হলে টেক্সট কাটার লজিক
  const truncateText = (text: string, isExpanded: boolean) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    
    if (isExpanded) return text;
    
    if (words.length > 9) {
      return words.slice(0, 9).join(" ") + "...";
    }
    return text;
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="notification-layout">
      {/* হেডার */}
      <LotteryHeader userProfile={profile} />

      {/* মেইন কন্টেন্ট */}
      <main className="notification-main">
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notif">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => {
              const isExpanded = expandedId === notif.id;
              const wordCount = notif.message ? notif.message.trim().split(/\s+/).length : 0;
              const hasMoreWords = wordCount > 9;

              return (
                <div 
                  key={notif.id} 
                  className="notif-list-item"
                  onClick={() => handleRead(notif)}
                >
                  <div className="notif-item-header">
                    <h3 className="notif-item-title">{notif.title}</h3>
                    {!notif.is_read && <span className="unread-dot"></span>}
                  </div>
                  
                  <p className="notif-item-message">
                    {truncateText(notif.message, isExpanded)}
                  </p>

                  {(hasMoreWords || isExpanded) && (
                    <button 
                      className="see-more-btn"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setExpandedId(isExpanded ? null : notif.id);
                        handleRead(notif); 
                      }}
                    >
                      {isExpanded ? "See Less" : "See More"}
                    </button>
                  )}
                  
                  <span className="notif-item-time">{timeAgo(notif.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ফুটার */}
      <LotteryFooter />
    </div>
  );
}
