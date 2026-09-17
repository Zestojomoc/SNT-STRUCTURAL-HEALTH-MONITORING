import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Keep development chunks separate from production build output. This avoids
  // missing-chunk errors in cloud-synced folders such as OneDrive.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async rewrites() {
    // Optional development-only bridge for running `next dev` and Uvicorn as
    // separate processes. Production stays same-origin and needs no URL override.
    const localApiUrl = process.env.SHM_LOCAL_API_URL;
    if (process.env.NODE_ENV === "development" && localApiUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${localApiUrl.replace(/\/$/, "")}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
