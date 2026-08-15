import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OtoScan AI — Intelligent Vehicle Inspection System",
  description:
    "Sistem inspeksi fisik kendaraan berbasis kecerdasan buatan yang mendeteksi kerusakan otomatis menggunakan YOLOv12 Computer Vision.",
  keywords: ["vehicle inspection", "AI", "damage detection", "YOLOv12", "OtoScan"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
