import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Redis } from "@upstash/redis";
import { localPhotos } from "@/data/photos";
import { profile } from "@/data/profile";
import {
  chooseToken,
  fetchInstagramPhotos,
  refreshInstagramToken,
  tokenSeed,
  type Photo,
  type StoredToken,
} from "@/lib/instagram";

const TOKEN_KEY = "portfolio:instagram:token";

function tokenStore() {
  return process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;
}

/**
 * The token to call Instagram with. With Redis it is kept there and renewed
 * before it runs out; without Redis (local and preview builds) the
 * environment token is used as it is.
 */
async function currentToken(envToken: string) {
  const store = tokenStore();
  if (!store) return envToken;
  try {
    const stored = await store.get<StoredToken>(TOKEN_KEY);
    const now = Date.now();
    const choice = chooseToken(stored ?? null, envToken, now);
    const seed = tokenSeed(envToken);
    if (choice.action === "seed") {
      await store.set(TOKEN_KEY, { token: envToken, savedAt: now, seed });
    } else if (choice.action === "refresh") {
      try {
        const token = await refreshInstagramToken(choice.token);
        await store.set(TOKEN_KEY, { token, savedAt: now, seed });
        return token;
      } catch {
        // Keep using the old token; the next rebuild tries again.
      }
    }
    return choice.token;
  } catch {
    return envToken;
  }
}

// `seed` is only there to be part of the cache key: a new token must not be
// answered from what was cached for the old one.
async function loadInstagramPhotos(seed: string): Promise<Photo[]> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!envToken || !seed) return [];
  return fetchInstagramPhotos(
    await currentToken(envToken),
    profile.photography.handle,
  );
}

// One hour, like the GitHub projects. Instagram's image links are signed and
// run out after a while, so the page must not keep them much longer.
const getCachedInstagramPhotos = unstable_cache(
  loadInstagramPhotos,
  ["instagram-photos-v1"],
  { revalidate: 3600 },
);

/** Instagram's latest posts, or the files in the repository. Never throws. */
export const getPhotos = cache(async (): Promise<Photo[]> => {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!envToken) return localPhotos;
  try {
    const photos = await getCachedInstagramPhotos(tokenSeed(envToken));
    if (photos.length > 0) return photos;
  } catch {
    // Not connected, token expired or Instagram unreachable: use the files.
  }
  return localPhotos;
});
