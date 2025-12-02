import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to allow API routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
