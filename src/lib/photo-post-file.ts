// Reads one post's post.json from the content repository (see docs/photos.md).
// Pure (no file system, no network), so it can be tested. The file is written
// by scripts/add-photos.mjs; everything is checked again here because the
// content comes from outside this repository.
import { instagramPostUrl } from "@/lib/photo-posts";

export type PhotoPost = {
  /** The post's number: the highest is the latest. */
  id: string;
  /** The folder's name on the author's disk, shown under the folder. */
  folder: string;
  /** The post's title, shown on its page. */
  title: string;
  /** Hashtags, without the #. */
  hashtags: string[];
  /** Where it was taken, or "". */
  location: string;
  /** The post on Instagram (an https instagram.com address), or "". */
  link: string;
  /** What the cover shows, for people who cannot see it. */
  alt: string;
  /** How many numbered photos follow the cover. */
  photos: number;
  /** The numbered photos that are landscape (4:3); the rest are 3:4. */
  landscape: number[];
  /** Image name ("cover", "cover-s", "1", "1-s", ...) to its git blob id. */
  versions: Record<string, string>;
};

export const MAX_PHOTOS = 200;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * One post, or null when post.json is unusable: not JSON, no alt text, a photo
 * count that does not match the image files in `files` (name -> blob id), or a
 * landscape list outside the photos.
 */
export function parsePostFile(
  id: string,
  json: string,
  files: Record<string, string>,
): PhotoPost | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return null;
  const data = raw as Record<string, unknown>;

  const alt = text(data.alt, 500);
  const title = text(data.title, 200);
  const photos = data.photos;
  if (!alt || !title) return null;
  if (
    typeof photos !== "number" ||
    !Number.isInteger(photos) ||
    photos < 0 ||
    photos > MAX_PHOTOS
  )
    return null;

  const landscape = Array.isArray(data.landscape) ? data.landscape : [];
  if (
    !landscape.every(
      (n) =>
        typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= photos,
    )
  )
    return null;

  const names = ["cover"];
  for (let n = 1; n <= photos; n++) names.push(String(n));
  const versions: Record<string, string> = {};
  for (const name of names) {
    for (const key of [name, `${name}-s`]) {
      if (!files[key]) return null;
      versions[key] = files[key];
    }
  }

  const link = text(data.link, 300);
  return {
    id,
    folder: text(data.folder, 80) || id,
    title,
    hashtags: Array.isArray(data.hashtags)
      ? [
          ...new Set(
            data.hashtags
              .map((tag) => text(tag, 50).replace(/^#/, ""))
              .filter(Boolean),
          ),
        ].slice(0, 30)
      : [],
    location: text(data.location, 120),
    link: instagramPostUrl(link) ? link : "",
    alt,
    photos,
    landscape: [...new Set(landscape as number[])],
    versions,
  };
}
