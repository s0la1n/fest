import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async redirects() {
    return [{ source: '/applications', destination: '/', permanent: false }];
  },

  // 🔥 УДАЛИТЕ ИЛИ ЗАКОММЕНТИРУЙТЕ rewrites для продакшена
  // async rewrites() {
  //   return [];
  // },
};

export default nextConfig;