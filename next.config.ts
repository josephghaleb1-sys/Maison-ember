import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next's default Server Action body limit is 1MB, but product/logo/
      // hero photo uploads (see src/lib/storage.ts) are validated up to
      // 5MB — leave headroom for multipart/form-data overhead on top of that
      // so a compressed photo close to the limit doesn't get rejected before
      // our own validation ever runs.
      bodySizeLimit: "8mb",
    },
  },
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
