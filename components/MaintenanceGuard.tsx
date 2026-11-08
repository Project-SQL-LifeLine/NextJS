"use client";

import { usePathname } from "next/navigation";
import { useSiteSettings } from "../lib/SiteSettingsContext";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { maintenanceMode, maintenanceMessage, siteName } = useSiteSettings();

  // যদি মেইনটেন্যান্স মোড অন থাকে এবং ইউজার অ্যাডমিন প্যানেলে না থাকে
  if (maintenanceMode && !pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen bg-[#0F212E] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#1A2C38] border border-[#2F4553] p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-[#ED4163]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#ED4163]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{siteName} is Under Maintenance</h1>
          <p className="text-[#B1BAD3] text-sm leading-relaxed mb-6">
            {maintenanceMessage}
          </p>
        </div>
      </div>
    );
  }

  // যদি মেইনটেন্যান্স মোড অফ থাকে, তবে স্বাভাবিক পেজ দেখাবে
  return <>{children}</>;
}
