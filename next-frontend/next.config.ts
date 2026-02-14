import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,

  // Прокси для Laravel API (чтобы избежать CORS ошибок)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Laravel
      },
    ];
  },
};

export default nextConfig;
