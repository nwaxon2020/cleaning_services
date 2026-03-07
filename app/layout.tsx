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
  description: "Premier cleaning services in Boston, UK. Expert residential and commercial cleaning with hospital-grade standards.",
  keywords: ["Cleaning Services Boston", "Office Cleaning Lincolnshire", "Domestic Cleaners", "Professional House Cleaning"],
  authors: [{ name: "BostonClean Team" }],
  
  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    title: "BostonClean | Professional Cleaning Services",
    description: "Expert cleaning services for your home and office. Restore comfort to your space today.",
    url: "https://bostonclean.co.uk", // Replace with your actual domain
    siteName: "BostonClean",
    images: [
      {
        url: "https://res.cloudinary.com/dqm6hjihm/image/upload/v1772900012/site_image_o1mqvz.png", // Ensure you save your logo/banner as og-image.png in /public
        width: 1200,
        height: 630,
        alt: "BostonClean Professional Services",
      },
    ],
    locale: "en_GB",
    type: "website",
  },

  // Twitter Tags
  twitter: {
    card: "summary_large_image",
    title: "BostonClean | Professional Cleaning Services",
    description: "Expert residential and commercial cleaning in Boston, UK.",
    images: ["https://res.cloudinary.com/dqm6hjihm/image/upload/v1772900012/site_image_o1mqvz.png"], 
  },

  // Icons
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png", // Recommended for iPhone home screen bookmarks
  },
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