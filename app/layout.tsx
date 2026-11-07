import type { Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";

export const metadata = {
  title: "Casino Site",
  description: "Premium Dark Casino",
};

// জুম বন্ধ করার জন্য Viewport কনফিগ
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
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
