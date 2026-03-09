import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple TestOps",
  description: "Test management service",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
