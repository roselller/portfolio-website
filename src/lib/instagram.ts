// Reads the account's own posts through the Instagram API with Instagram
// Login (graph.instagram.com). Pure helpers plus two fetches; the token is
// handled by photos.ts and never appears in an error message.
import { createHash } from "node:crypto";
import { z } from "zod";

export type Photo = {
  id: string;
  /** Image address: an Instagram CDN URL, or a file under /photos/. */
  src: string;
  alt: string;
  /** The Instagram post this photo links to, or null. */
  href: string | null;
};

const API = "https://graph.instagram.com";
const API_VERSION = "v27.0";
const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
export const PHOTO_LIMIT = 12;
const ALT_LENGTH = 140;

const mediaList = z.object({ data: z.array(z.unknown()) });
const mediaItem = z.object({
  id: z.string().regex(/^\d{1,40}$/),
  caption: z.string().optional(),
  media_type: z.enum(["IMAGE", "CAROUSEL_ALBUM", "VIDEO"]),
  media_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  permalink: z.string().optional(),
});

function httpsUrl(value: string | undefined, hosts?: RegExp) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!hosts || hosts.test(url.hostname))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Alt text from a caption: its first line, without hashtags, kept short. */
export function captionAlt(caption: string | undefined, handle: string) {
  const line = (caption ?? "")
    .split("\n")[0]
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!line) return `Photo by @${handle} on Instagram`;
  return line.length > ALT_LENGTH
    ? `${line.slice(0, ALT_LENGTH - 1).trimEnd()}…`
    : line;
}

/**
 * Instagram's answer as photos. Posts that are malformed or have no image are
 * skipped; albums use their cover image and videos their thumbnail.
 */
export function parseInstagramMedia(json: unknown, handle: string): Photo[] {
  const list = mediaList.safeParse(json);
  if (!list.success) throw new Error("Instagram's answer could not be read.");
  const photos: Photo[] = [];
  for (const entry of list.data.data) {
    const item = mediaItem.safeParse(entry);
    if (!item.success) continue;
    const { id, caption, media_type, media_url, thumbnail_url, permalink } =
      item.data;
    const src = httpsUrl(media_type === "VIDEO" ? thumbnail_url : media_url);
    if (!src) continue;
    photos.push({
      id,
      src,
      alt: captionAlt(caption, handle),
      href: httpsUrl(permalink, /^(www\.)?instagram\.com$/),
    });
    if (photos.length === PHOTO_LIMIT) break;
  }
  return photos;
}

async function getJson(path: string, params: Record<string, string>) {
  const url = new URL(`${API}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // The original error can carry the URL, and the URL carries the token.
    throw new Error("Instagram could not be reached.");
  }
  if (!response.ok) {
    throw new Error(`Instagram answered ${response.status}.`);
  }
  return (await response.json()) as unknown;
}

export async function fetchInstagramPhotos(token: string, handle: string) {
  return parseInstagramMedia(
    await getJson(`${API_VERSION}/me/media`, {
      fields: MEDIA_FIELDS,
      limit: String(PHOTO_LIMIT * 2),
      access_token: token,
    }),
    handle,
  );
}

const refreshed = z.object({ access_token: z.string().min(20) });

/** A fresh 60-day token in exchange for one that is still valid. */
export async function refreshInstagramToken(token: string) {
  return refreshed.parse(
    await getJson("refresh_access_token", {
      grant_type: "ig_refresh_token",
      access_token: token,
    }),
  ).access_token;
}

// Long-lived tokens last 60 days. The one in use is kept in Redis and swapped
// for a fresh one once it is this old; the environment variable is the seed.
export const TOKEN_REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type StoredToken = {
  token: string;
  /** When this token was issued to us (ms since 1970). */
  savedAt: number;
  /** Fingerprint of the environment token it descends from. */
  seed: string;
};

export function tokenSeed(envToken: string) {
  return createHash("sha256").update(envToken).digest("hex").slice(0, 16);
}

/**
 * Which token to use and what to do with the store:
 * - "seed": nothing stored for this environment token (first run, or the
 *   owner pasted a new one): use the environment token and store it.
 * - "refresh": the stored token is old enough to be swapped.
 * - "use": the stored token is fine.
 */
export function chooseToken(
  stored: StoredToken | null,
  envToken: string,
  now: number,
): { token: string; action: "seed" | "refresh" | "use" } {
  if (!stored || stored.seed !== tokenSeed(envToken) || !stored.token) {
    return { token: envToken, action: "seed" };
  }
  return {
    token: stored.token,
    action: now - stored.savedAt >= TOKEN_REFRESH_AFTER_MS ? "refresh" : "use",
  };
}
