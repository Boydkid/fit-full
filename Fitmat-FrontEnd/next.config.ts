import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // สำหรับ GitHub Pages: ใช้ static export
  // หมายเหตุ: ถ้าใช้ static export จะใช้ API Routes ไม่ได้
  // คอมเมนต์ออกถ้าต้องการใช้ SSR หรือ API Routes
  output: process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true' ? {
    unoptimized: true, // จำเป็นสำหรับ static export
  } : undefined,
  // สำหรับ GitHub Pages: ตั้งค่า base path และ asset prefix
  basePath: process.env.GITHUB_PAGES ? '/FITMAT' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/FITMAT' : '',
};

export default nextConfig;
