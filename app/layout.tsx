import type { Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";
import { SiteSettingsProvider } from "../lib/SiteSettingsContext";
import MaintenanceGuard from "../components/MaintenanceGuard";

export const metadata = {
  title: "Casino Site",
  description: "Premium Dark Casino",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <SiteSettingsProvider>
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
          </SiteSettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
