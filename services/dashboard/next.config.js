/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_INGESTION_URL: process.env.NEXT_PUBLIC_INGESTION_URL || 'http://localhost:3001',
    NEXT_PUBLIC_TRANSFORMATION_URL: process.env.NEXT_PUBLIC_TRANSFORMATION_URL || 'http://localhost:3002',
    NEXT_PUBLIC_REPORTING_URL: process.env.NEXT_PUBLIC_REPORTING_URL || 'http://localhost:3003',
  },
};

module.exports = nextConfig;
