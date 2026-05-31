import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React 19 features
  reactStrictMode: true,
  
  // Environment variables
  env: {
    GIT_HASH: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
  },
  
  // Optimize images (optional - IndexedDB stores data URLs)
  images: {
    unoptimized: true,
  },
  
  // Turbopack configuration (empty to silence warning)
  turbopack: {},
};

export default nextConfig;
