import "./globals.css";

export const metadata = {
  title: "Casino Site",
  description: "Premium Dark Casino",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
