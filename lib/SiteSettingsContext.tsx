"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase/client";

interface SiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [siteName, setSiteName] = useState("Casino");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("site_name, maintenance_mode, maintenance_message")
          .eq("id", 1)
          .single();

        if (!error && data) {
          setSiteName(data.site_name || "Casino");
          setMaintenanceMode(data.maintenance_mode || false);
          setMaintenanceMessage(data.maintenance_message || "We are currently under maintenance. Please check back later.");
        }
      } catch (err) {
        console.error("Failed to load site settings", err);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ siteName, maintenanceMode, maintenanceMessage }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
