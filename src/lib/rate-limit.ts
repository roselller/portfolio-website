import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SITE_LIMIT_REASON } from "./contact-service";

// Each visitor: 5 messages per 10 minutes. The whole site: 30 messages per UTC
// day, so spam from many addresses cannot use up Resend's free daily email
// allowance (100) or fill the database.
const SITE_DAILY_LIMIT = 30;
const SITE_KEY = "all-visitors";

type ContactLimiters = { visitor: Ratelimit; site: Ratelimit };
let limiters: ContactLimiters | undefined;

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

function getContactLimiters(): ContactLimiters | null {
  if (!isContactConfigured()) return null;
  if (!limiters) {
    const redis = Redis.fromEnv();
    limiters = {
      visitor: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "portfolio:contact",
        analytics: false,
      }),
      site: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(SITE_DAILY_LIMIT, "1 d"),
        prefix: "portfolio:sitecap",
        analytics: false,
      }),
    };
  }
  return limiters;
}

/**
 * Checks the visitor's limit first, so a blocked visitor never spends the
 * site-wide allowance, then the site-wide daily limit. A timeout is passed
 * through as-is: the contact service rejects it instead of failing open.
 */
export async function checkContactLimits(
  requestHeaders: Pick<Headers, "get">,
): Promise<{ success: boolean; reason?: string }> {
  const active = getContactLimiters();
  if (!active) throw new Error("Contact is unavailable.");

  const visitor = await active.visitor.limit(getRateLimitKey(requestHeaders));
  await visitor.pending;
  if (visitor.reason === "timeout" || !visitor.success) return visitor;

  const site = await active.site.limit(SITE_KEY);
  await site.pending;
  if (site.reason === "timeout") return site;
  if (!site.success) return { success: false, reason: SITE_LIMIT_REASON };
  return { success: true };
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
