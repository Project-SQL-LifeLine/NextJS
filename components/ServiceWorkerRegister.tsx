"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // basePath "/NextJS" সহ ফাইলটি রেজিস্টার করা হচ্ছে
        navigator.serviceWorker
          .register("/NextJS/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully!");
          })
          .catch((err) => {
            console.log("Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null; 
}
