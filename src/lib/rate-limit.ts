import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | undefined;

export function isContactConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.RATE_LIMIT_SALT &&
    process.env.RESEND_API_KEY &&
    process.env.CONTACT_TO_EMAIL,
  );
}

export function getContactLimiter() {
  if (!isContactConfigured()) return null;
  limiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "portfolio:contact",
    analytics: false,
  });
  return limiter;
}

export function getRateLimitKey(requestHeaders: Pick<Headers, "get">) {
  // Trust only headers overwritten by the selected deployment platform.
  // Unknown/self-hosted traffic shares a bucket until its proxy is configured.
  const header = process.env.VERCEL
    ? requestHeaders.get("x-vercel-forwarded-for")
    : process.env.NETLIFY
      ? requestHeaders.get("x-nf-client-connection-ip")
      : null;
  const candidate = header?.split(",")[0]?.trim();
  const ip = candidate && isIP(candidate) ? candidate : "unidentified-client";
  return createHmac("sha256", process.env.RATE_LIMIT_SALT || "unconfigured")
    .update(ip)
    .digest("hex");
}
