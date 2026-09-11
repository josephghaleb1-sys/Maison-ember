import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product/gallery photos are already resized + recompressed client-side
    // before upload (see src/lib/image-compress.ts) and served straight from
    // Supabase Storage's public CDN. Running them through Vercel's Image
    // Optimization pipeline on top of that adds a remote-pattern/build-env
    // dependency and a request quota for no real benefit here — serve the
    // Supabase URL as-is instead.
    unoptimized: true,
  },
};

export default nextConfig;
