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

// POPULATED METADATA BASED ON SITE SETTINGS
export const metadata: Metadata = {
  title: "Isundunrin Services | Your Premier Service provider",
  description: "Premier residential and commercial services in Bristol, UK. Expert cleaning, rentals, decoration, and health concierge with premium standards.",
  keywords: ["Isundunrin Services", "Cleaning Services Bristol", "Rental Services UK", "Decoration Services Bristol", "Health Concierge UK"],
  authors: [{ name: "Isundunrin Team" }],
  
  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    title: "Isundunrin Services | Professional Care & Excellence",
    description: "Expert cleaning, rentals, decoration, and health concierge for your home and office. Restore comfort to your space today.",
    url: "https://isundunrin.co.uk", // Replace with your actual domain
    siteName: "Isundunrin",
    images: [
      {
        url: "https://res.cloudinary.com/dqm6hjihm/image/upload/v1772900012/site_image_o1mqvz.png",
        width: 1200,
        height: 630,
        alt: "Isundunrin Professional Services",
      },
    ],
    locale: "en_GB",
    type: "website",
  },

  // Twitter Tags
  twitter: {
    card: "summary_large_image",
    title: "Isundunrin Services | Professional Care & Excellence",
    description: "Expert cleaning, rentals, and premium concierge services in Bristol, UK.",
    images: ["https://res.cloudinary.com/dqm6hjihm/image/upload/v1772900012/site_image_o1mqvz.png"], 
  },

  // Icons (Preserved as requested)
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png", 
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