import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
// Orchids restart: 1763728958862
