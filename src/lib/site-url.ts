/**
 * The site's public origin, without a trailing slash.
 * Order: NEXT_PUBLIC_SITE_URL, then Vercel's production domain, then localhost.
 */
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const origin = configured || (vercel ? `https://${vercel}` : "");
  return (origin || "http://localhost:3000").replace(/\/+$/, "");
}
