// Reads the account's own posts through the Instagram API on
// graph.facebook.com, with the token that Meta's "API setup with Unified
// login" issues (a system-user token; it does not expire, so there is nothing
// to renew). The token travels in a header, never in a URL or an error.
import { createHash } from "node:crypto";
import { z } from "zod";

export type Photo = {
  id: string;
  /** Image address: an Instagram CDN URL, or a file under /photography/. */
  src: string;
  alt: string;
  /** Where the photo leads: its own page (/photos/<id>) for a post kept in
      the repository, the Instagram post for one read from Instagram, or null. */
  href: string | null;
  /** More photos from the same post, which fan out behind it on hover. */
  fan: string[];
};

const API = "https://graph.facebook.com/v26.0";
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
      fan: [],
    });
    if (photos.length === PHOTO_LIMIT) break;
  }
  return photos;
}

async function getJson(
  path: string,
  params: Record<string, string>,
  token: string,
) {
  const url = new URL(`${API}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("Instagram could not be reached.");
  }
  if (!response.ok) {
    throw new Error(`Instagram answered ${response.status}.`);
  }
  return (await response.json()) as unknown;
}

const ACCOUNT_ID = /^\d{5,40}$/;
const accountList = z.object({
  data: z.array(
    z.object({
      id: z.string().regex(ACCOUNT_ID),
      username: z.string().optional(),
    }),
  ),
});

/**
 * The Instagram account the token may read: the one named `handle`, else the
 * first one. Throws when the token has no account assigned.
 */
export function pickInstagramAccount(json: unknown, handle: string) {
  const list = accountList.safeParse(json);
  if (!list.success || list.data.data.length === 0) {
    throw new Error("The token has no Instagram account assigned.");
  }
  const wanted = handle.toLowerCase();
  return (
    list.data.data.find(
      (account) => account.username?.toLowerCase() === wanted,
    ) ?? list.data.data[0]
  ).id;
}

/**
 * The latest posts. `accountId` (INSTAGRAM_ACCOUNT_ID) skips the lookup; it is
 * needed when the token works but Meta lists no assigned account for it.
 */
export async function fetchInstagramPhotos(
  token: string,
  handle: string,
  accountId?: string,
) {
  const id =
    accountId && ACCOUNT_ID.test(accountId)
      ? accountId
      : pickInstagramAccount(
          await getJson(
            "me/assigned_instagram_accounts",
            { fields: "id,username" },
            token,
          ),
          handle,
        );
  return parseInstagramMedia(
    await getJson(
      `${id}/media`,
      { fields: MEDIA_FIELDS, limit: String(PHOTO_LIMIT * 2) },
      token,
    ),
    handle,
  );
}

/** A fingerprint of the token, for cache keys: never the token itself. */
export function tokenSeed(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
