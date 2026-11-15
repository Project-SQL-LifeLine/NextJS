"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; // পাথ চেক করুন
import LotteryHeader from "../Lottery/Header/Header"; // হেডার পাথ
import LotteryFooter from "../Lottery/Footer/Footer"; // ফুটার পাথ
import "./notification.css";

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // কোন কার্ডটি বড় করা হয়েছে তা ট্র্যাক করার জন্য
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // প্রোফাইল ডাটা হেডারের জন্য
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) setProfile(profileData);

        // নোটিফিকেশন ডাটা
        const { data, error } = await supabase
          .from("user_notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch Error:", error.message);
        } else if (data) {
          // শুধু active এবং ইউজারের নিজের বা ব্রডকাস্ট নোটিফিকেশন ফিল্টার
          const myNotifications = data.filter((notif) => {
            const isActive = notif.status === 'active' || notif.status === null;
            const isForMe = notif.user_id === user.id || notif.user_id === null;
            return isActive && isForMe;
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

  // ৩০ শব্দের বেশি হলে "See More" দেখানোর লজিক
  const truncateText = (text: string, isExpanded: boolean) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    
    // যদি এক্সপ্যান্ড করা থাকে, পুরো টেক্সট দেখাবে
    if (isExpanded) return text;
    
    // যদি ৩০ শব্দের বেশি হয়, তবে প্রথম ৩০ শব্দ দেখাবে
    if (words.length > 30) {
      return words.slice(0, 30).join(" ") + "...";
    }
    return text;
  };

  // নোটিফিকেশনে ক্লিক করলে Read মার্ক করা
  const handleRead = async (notif: any) => {
    if (!notif.is_read) {
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      if (notif.user_id) {
        await supabase.from("user_notifications").update({ is_read: true }).eq("id", notif.id);
      }
    }
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
        <div className="notification-header-title">
          <h1 className="text-xl font-bold text-white mb-4">Notifications</h1>
        </div>

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
              const hasMoreWords = notif.message.trim().split(/\s+/).length > 30;

              return (
                <div 
                  key={notif.id} 
                  className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleRead(notif)}
                >
                  <div className="notif-header">
                    <h3 className="notif-title">{notif.title}</h3>
                    {!notif.is_read && <span className="unread-dot"></span>}
                  </div>
                  
                  {/* মেসেজ (৩০ শব্দের লিমিটসহ) */}
                  <p className="notif-message">
                    {truncateText(notif.message, isExpanded)}
                  </p>

                  {/* See More / See Less বাটন */}
                  {(hasMoreWords || isExpanded) && (
                    <button 
                      className="see-more-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // কার্ডের ক্লিক ইভেন্ট বন্ধ করতে
                        setExpandedId(isExpanded ? null : notif.id);
                        handleRead(notif);
                      }}
                    >
                      {isExpanded ? "See Less" : "See More"}
                    </button>
                  )}
                  
                  <span className="notif-time">{timeAgo(notif.created_at)}</span>
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
