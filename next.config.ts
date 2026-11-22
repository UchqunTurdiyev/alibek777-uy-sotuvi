import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"], qualities: [70, 75], minimumCacheTTL: 31536000 },
};

export default nextConfig;
