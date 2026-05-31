import type { NextConfig } from "next";
import { execSync } from 'child_process';

// Get git hash - use Vercel env var if available, otherwise use local git
const getGitHash = () => {
  try {
    // Try Vercel env var first
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
    }
    // Fall back to local git command
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

const nextConfig: NextConfig = {
  // Enable React 19 features
  reactStrictMode: true,
  
  // Environment variables
  env: {
    GIT_HASH: getGitHash(),
  },
  
  // Optimize images (optional - IndexedDB stores data URLs)
  images: {
    unoptimized: true,
  },
  
  // Turbopack configuration (empty to silence warning)
  turbopack: {},
};

export default nextConfig;
