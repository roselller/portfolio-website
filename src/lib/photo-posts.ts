// Pure helpers for the photo posts kept in the repository (no file system, so
// they can be tested). A post's files live in public/photography/<id>/ as
// cover.webp, then 1.webp, 2.webp, ...; scripts/add-photos.mjs writes each one
// upright at POST_IMAGE_SHORT x POST_IMAGE_LONG (3:4), or the other way round
// for a landscape photo (4:3).
import type { PhotoPost } from "@/data/photos";

export const POST_IMAGE_SHORT = 1080;
export const POST_IMAGE_LONG = 1440;
/** How many photos pop out of a post's folder under the pointer. */
export const PREVIEW_COUNT = 3;
const POST_ID = /^\d{1,6}$/;

export function isPostId(value: string) {
  return POST_ID.test(value);
}

function file(id: string, name: string) {
  return `/photography/${id}/${name}.webp`;
}

/** Latest (highest number) first; entries with an unusable id are dropped. */
export function sortPosts(posts: readonly PhotoPost[]) {
  return posts
    .filter((post) => isPostId(post.id))
    .sort((a, b) => Number(b.id) - Number(a.id));
}

export type PostImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

function sized(landscape: boolean) {
  return landscape
    ? { width: POST_IMAGE_LONG, height: POST_IMAGE_SHORT }
    : { width: POST_IMAGE_SHORT, height: POST_IMAGE_LONG };
}

/** Every photo of a post, the cover first. */
export function postImages(post: PhotoPost): PostImage[] {
  const count = Math.max(0, Math.floor(post.photos));
  return [
    { src: file(post.id, "cover"), alt: post.alt, ...sized(false) },
    ...Array.from({ length: count }, (_, index) => ({
      src: file(post.id, String(index + 1)),
      alt: `Photo ${index + 1} of ${count} from ${post.title}`,
      ...sized(post.landscape.includes(index + 1)),
    })),
  ];
}

/** A post as the Work page shows it: a folder that opens the post's page. */
export type PostFolder = {
  id: string;
  /** The folder's name, shown under it. */
  title: string;
  href: string;
  /** The first photos (cover first), which pop out under the pointer. */
  previews: string[];
};

export function postToFolder(post: PhotoPost): PostFolder {
  return {
    id: post.id,
    title: post.folder,
    href: `/photos/${post.id}`,
    previews: postImages(post)
      .slice(0, PREVIEW_COUNT)
      .map((image) => image.src),
  };
}

/** Folders in the order a file browser lists them: by number, lowest first. */
export function toFolders(posts: readonly PhotoPost[]) {
  return sortPosts(posts).reverse().map(postToFolder);
}
