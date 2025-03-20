import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8787/api/:path*', // Cloudflare Workers local port
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/chat/stream",
        headers: [
          {
            key: "Content-Encoding",
            value: "none", // Disable compression for streaming endpoint
          },
        ],
      },
    ];
  }
};

export default nextConfig;
