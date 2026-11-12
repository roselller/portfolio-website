// Pure helpers for the photo posts kept in the repository (no file system, so
// they can be tested). A post's files live in public/photography/<id>/ as
// cover.webp, then 1.webp, 2.webp, ...; scripts/add-photos.mjs writes them all
// at POST_IMAGE_WIDTH x POST_IMAGE_HEIGHT (3:4, upright).
import type { PhotoPost } from "@/data/photos";

export const POST_IMAGE_WIDTH = 1080;
export const POST_IMAGE_HEIGHT = 1440;
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

/** Every photo of a post, the cover first. */
export function postImages(post: PhotoPost) {
  const count = Math.max(0, Math.floor(post.photos));
  return [
    { src: file(post.id, "cover"), alt: post.alt },
    ...Array.from({ length: count }, (_, index) => ({
      src: file(post.id, String(index + 1)),
      alt: `Photo ${index + 1} of ${count} from ${post.title}`,
    })),
  ];
}

/** A post as the Work page shows it: a folder that opens the post's page. */
export type PostFolder = {
  id: string;
  title: string;
  href: string;
  /** The first photos (cover first), which pop out under the pointer. */
  previews: { src: string; alt: string }[];
};

export function postToFolder(post: PhotoPost): PostFolder {
  return {
    id: post.id,
    title: post.title,
    href: `/photos/${post.id}`,
    previews: postImages(post).slice(0, PREVIEW_COUNT),
  };
}

/** Folders in the order a file browser lists them: by number, lowest first. */
export function toFolders(posts: readonly PhotoPost[]) {
  return sortPosts(posts).reverse().map(postToFolder);
}
