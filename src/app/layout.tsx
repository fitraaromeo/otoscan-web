import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./_context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OtoScan AI — Intelligent Vehicle Inspection System",
  description:
    "AI-powered vehicle physical inspection system detecting damages automatically using YOLOv12 Computer Vision.",
  keywords: ["vehicle inspection", "AI", "damage detection", "YOLOv12", "OtoScan"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#0B0F19] text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

