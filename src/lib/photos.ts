import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { localPhotos } from "@/data/photos";
import { profile } from "@/data/profile";
import { fetchInstagramPhotos, tokenSeed, type Photo } from "@/lib/instagram";

// `seed` is only there to be part of the cache key: a new token must not be
// answered from what was cached for the old one.
async function loadInstagramPhotos(seed: string): Promise<Photo[]> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!envToken || !seed) return [];
  return fetchInstagramPhotos(
    envToken,
    profile.photography.handle,
    process.env.INSTAGRAM_ACCOUNT_ID?.trim(),
  );
}

// One hour, like the GitHub projects. Instagram's image links are signed and
// run out after a while, so the page must not keep them much longer.
const getCachedInstagramPhotos = unstable_cache(
  loadInstagramPhotos,
  ["instagram-photos-v2"],
  { revalidate: 3600 },
);

/** The posts kept in the repository, latest (highest number) first. */
function filePhotos() {
  return [...localPhotos].sort((a, b) => Number(b.id) - Number(a.id));
}

/** Instagram's latest posts, or the files in the repository. Never throws. */
export const getPhotos = cache(async (): Promise<Photo[]> => {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!envToken) return filePhotos();
  try {
    const photos = await getCachedInstagramPhotos(tokenSeed(envToken));
    if (photos.length > 0) return photos;
  } catch {
    // Not connected, token expired or Instagram unreachable: use the files.
  }
  return filePhotos();
});
