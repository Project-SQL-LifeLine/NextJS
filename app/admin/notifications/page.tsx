"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client"; // পাথ চেক করে নিন
import "./admin-notification.css";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // নতুন নোটিফিকেশন তৈরি
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("user_notifications").insert({
      title,
      message,
      status: "active",
      scheduled_at: scheduleDate ? new Date(scheduleDate).toISOString() : null,
      user_id: null, // null মানে সব ইউজার পাবে
    });

    if (!error) {
      setTitle("");
      setMessage("");
      setScheduleDate("");
      fetchNotifications();
    }
    setIsSubmitting(false);
  };

  // স্ট্যাটাস পরিবর্তন (Active, Hidden, Blocked)
  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("user_notifications").update({ status: newStatus }).eq("id", id);
    fetchNotifications();
  };

  // ডিলিট করা
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      await supabase.from("user_notifications").delete().eq("id", id);
      fetchNotifications();
    }
  };

  return (
    <div className="admin-notif-wrapper">
      <div className="admin-header">
        <h1 className="admin-title">Manage Notifications</h1>
      </div>

      {/* নতুন নোটিফিকেশন ফর্ম */}
      <form className="notif-form" onSubmit={handleCreate}>
        <div className="form-group">
          <label className="form-label">Notification Title</label>
          <input 
            type="text" 
            className="admin-input" 
            placeholder="e.g. Jackpot Alert!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea 
            className="admin-input" 
            rows={3}
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Schedule Time (Optional)</label>
          <input 
            type="datetime-local" 
            className="admin-input" 
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
            Leave empty to send instantly.
          </p>
        </div>
        <button type="submit" className="btn-create" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Push Notification"}
        </button>
      </form>

      {/* নোটিফিকেশন লিস্ট */}
      <div className="notif-list">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>No notifications found.</p>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`notif-item status-${notif.status}`}>
              <div className="notif-item-header">
                <div>
                  <h3 className="notif-item-title">{notif.title}</h3>
                  <p className="notif-item-meta">
                    Status: <span style={{ textTransform: 'capitalize' }}>{notif.status}</span> | 
                    {notif.scheduled_at ? ` Scheduled: ${new Date(notif.scheduled_at).toLocaleString()}` : " Sent Instantly"}
                  </p>
                </div>
              </div>
              <p className="notif-item-msg">{notif.message}</p>
              
              <div className="notif-actions">
                {notif.status === "active" ? (
                  <button className="action-btn" onClick={() => handleStatusChange(notif.id, "hidden")}>Hide</button>
                ) : (
                  <button className="action-btn" onClick={() => handleStatusChange(notif.id, "active")}>Unhide</button>
                )}
                <button className="action-btn" onClick={() => handleStatusChange(notif.id, "blocked")}>Block</button>
                <button className="action-btn delete" onClick={() => handleDelete(notif.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
