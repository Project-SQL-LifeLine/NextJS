"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // আপনার basePath "/NextJS" সহ ফাইলটি রেজিস্টার করা হচ্ছে
        navigator.serviceWorker
          .register("/NextJS/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully!", reg.scope);
          })
          .catch((err) => {
            console.log("Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null; // এটি স্ক্রিনে কিছু দেখাবে না, শুধু ব্যাকগ্রাউন্ডে কাজ করবে
}
