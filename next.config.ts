import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // This allows any image from any HTTPS website
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", 
      },
    ],
  },
};

export default nextConfig;