import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "secure.meetupstatic.com",
      },
    ],
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
