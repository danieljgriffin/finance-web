import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Fallback for local development if .env is missing
    FINANCE_API_BASE_URL: process.env.FINANCE_API_BASE_URL || 'http://127.0.0.1:8000',
    PERSONAL_API_TOKEN: process.env.PERSONAL_API_TOKEN || 'dev-token-123',
  },
};

export default nextConfig;
