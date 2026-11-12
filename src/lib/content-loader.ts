// Turns the content repository into posts and pieces of writing. Not tied to
// any server API, so the tests can run it with a fake source.
import { buildManifest } from "@/lib/content-manifest";
import type { ContentSource } from "@/lib/content-source";
import { parsePostFile, type PhotoPost } from "@/lib/photo-post-file";
import {
  parseWritingFile,
  sortWritings,
  type Writing,
} from "@/lib/writing-file";
import { sortPosts } from "@/lib/photo-posts";

export type Content = { posts: PhotoPost[]; writings: Writing[] };

const decoder = new TextDecoder("utf-8", { fatal: false });

/**
 * Throws when the list or any file cannot be read (so a failure is never
 * cached as an empty or partial result). A file that is read but is not usable
 * (bad post.json, no title) is skipped; the others are kept.
 */
export async function loadContent(source: ContentSource): Promise<Content> {
  const manifest = buildManifest(await source.list());
  const posts = await Promise.all(
    manifest.posts.map(async ({ id, json, images }) => {
      const text = decoder.decode(await source.readBytes(json));
      return parsePostFile(id, text, images);
    }),
  );
  const writings = await Promise.all(
    manifest.writings.map(async ({ slug, sha }) => {
      const text = decoder.decode(await source.readBytes(sha));
      return parseWritingFile(slug, text);
    }),
  );
  return {
    posts: sortPosts(posts.filter((post) => post !== null)),
    writings: sortWritings(writings.filter((item) => item !== null)),
  };
}
