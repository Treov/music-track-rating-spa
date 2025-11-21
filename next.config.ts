import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    // Set body size limit for App Router API routes and Server Actions
    bodySizeLimit: '50mb',
  },
  // Add this for API routes specifically
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
// Orchids restart: 1763730461227