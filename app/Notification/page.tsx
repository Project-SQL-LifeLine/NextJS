"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client"; // আপনার পাথ অনুযায়ী চেক করে নিন
import { useLanguage } from "../../lib/LanguageContext"; // আপনার পাথ অনুযায়ী চেক করে নিন
import "./notification.css";

export default function NotificationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ডাটা ফেচ করার ফাংশন (লেটেস্ট ডাটাবেস স্ট্রাকচার অনুযায়ী)
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from("user_notifications")
          .select("*")
          // ১. শুধু active নোটিফিকেশন দেখাবে (hidden বা blocked বাদ যাবে)
          .eq("status", "active")
          // ২. scheduled_at হয় নাল হবে (ইনস্ট্যান্ট), অথবা বর্তমান সময়ের চেয়ে ছোট হবে
          .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
          // ৩. হয় ইউজারের নিজের আইডি হবে, অথবা user_id নাল হবে (সবার জন্য ব্রডকাস্ট)
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase Error:", error);
        } else if (data) {
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // নোটিফিকেশনে ক্লিক করলে (Expand/Collapse এবং Read মার্ক করা)
  const handleCardClick = async (notif: any) => {
    // ১. এক্সপ্যান্ড/কলাপ্স টগল করা
    if (expandedId === notif.id) {
      setExpandedId(null); // কলাপ্স
    } else {
      setExpandedId(notif.id); // এক্সপ্যান্ড
    }

    // ২. যদি আনরিড (unread) থাকে, তবে ডাটাবেসে রিড (read) হিসেবে আপডেট করা
    if (!notif.is_read) {
      // লোকাল স্টেট আপডেট (তাৎক্ষণিক UI পরিবর্তনের জন্য ডট মুছে যাবে)
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );

      // ডাটাবেস আপডেট (শুধুমাত্র যদি নোটিফিকেশনটি ওই নির্দিষ্ট ইউজারের হয়)
      // *নোট: ব্রডকাস্ট (user_id: null) নোটিফিকেশন ডাটাবেসে আপডেট করা যাবে না, তবে UI-তে রিড হয়ে যাবে।
      if (notif.user_id) {
        await supabase
          .from("user_notifications")
          .update({ is_read: true })
          .eq("id", notif.id);
      }
    }
  };

  // সময় ফরম্যাট করা (যেমন: Just now, 2 hours ago)
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("Just now", "এইমাত্র");
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t("mins ago", "মিনিট আগে")}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t("hours ago", "ঘণ্টা আগে")}`;
    return `${Math.floor(diffInSeconds / 86400)} ${t("days ago", "দিন আগে")}`;
  };

  // লোডিং স্টেট
  if (loading) {
    return (
      <div className="notification-wrapper items-center justify-center">
        <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="text-white mt-4 text-xs font-semibold tracking-wider animate-pulse">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="notification-wrapper">
      
      {/* হেডার */}
      <div className="notification-header">
        <button onClick={() => router.back()} className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="notification-title">{t("Notifications", "নোটিফিকেশন")}</h1>
      </div>

      {/* নোটিফিকেশন লিস্ট */}
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-notif">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium">{t("No notifications yet.", "এখনো কোনো নোটিফিকেশন নেই।")}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => handleCardClick(notif)}
            >
              <div className="notif-header">
                <h3 className="notif-title">{notif.title}</h3>
                {/* আনরিড ডট */}
                {!notif.is_read && <span className="unread-dot"></span>}
              </div>
              
              {/* মেসেজ: expandedId মিললে expanded ক্লাস যুক্ত হবে এবং পুরো লেখা দেখাবে */}
              <p className={`notif-message ${expandedId === notif.id ? "expanded" : ""}`}>
                {notif.message}
              </p>
              
              <span className="notif-time">{timeAgo(notif.created_at)}</span>
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}
