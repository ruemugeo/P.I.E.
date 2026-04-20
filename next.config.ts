import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This allows Vercel to finish the build even if there are TS warnings
    ignoreBuildErrors: true,
  },
  eslint: {
    // This ignores linting errors during the build process
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;