import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean)
      .map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  experimental: { serverActions: { bodySizeLimit: "32kb" } },
};

export default nextConfig;
