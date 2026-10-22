import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Pages are static or ISR, so this CSP uses no nonces (see the Next.js CSP
// guide, "Without Nonces"). Notes on the less obvious entries:
// - blob: in script-src/worker-src: troika (the 3D sign text) starts its worker
//   from a blob URL and loads its modules inside it with importScripts().
// - img-src https: README images are plain <img> tags that point at GitHub
//   hosts and redirect to signed CDN URLs. The browser checks every redirect
//   hop, so a host allowlist would break them silently. Images cannot run code.
// - connect-src 'self' also blocks troika's optional fallback-font download from
//   a third-party CDN, so no visitor data leaves the site. The sign fonts must
//   therefore cover every character drawn in 3D (see toSignText).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Pages from other origins cannot keep a handle on this one (window.opener).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
