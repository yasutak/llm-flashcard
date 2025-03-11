import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:59119/api/:path*', // Cloudflare Workers local port
      },
    ];
  },
};

export default nextConfig;
