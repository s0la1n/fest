import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async redirects() {
    return [{ source: '/applications', destination: '/', permanent: false }];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/sanctum/:path*',
        destination: 'http://localhost:8000/sanctum/:path*',
      },
      {
        source: '/storage/:path*',
        destination: 'http://localhost:8000/storage/:path*',
      },
    ];
  },
};

export default nextConfig;