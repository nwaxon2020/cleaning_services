import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ReviewSection from "@/components/ReviewSection";
import Footer from "@/components/Footer";
import NewsUpdates from "@/components/NewsUpdates";
// 1. Import the Toaster
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BostonClean | Professional Cleaning Services",
  description: "Expert cleaning services for your home and office.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. Add Toaster here so it's available on every page */}
        <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
            },
          }}
        />
        
        <Navbar/>
        {children}
        <ReviewSection/>
        <NewsUpdates/>
        <Footer/>
      </body>
    </html>
  );
}