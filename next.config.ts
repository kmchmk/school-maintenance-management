import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Completion photos are compressed in the browser, but allow a few per request.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
