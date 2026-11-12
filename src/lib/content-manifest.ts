// Sorts the file list of the content repository into posts and pieces of
// writing. Pure, so it can be tested. Only paths of the exact shapes below are
// used; anything else in the repository is ignored.
//
//   photography/<number>/post.json
//   photography/<number>/cover.webp, cover-s.webp, 1.webp, 1-s.webp, ...
//   writing/<slug>.md

export type TreeEntry = { path: string; sha: string };

const POST_FILE =
  /^photography\/(\d{1,6})\/(post\.json|(?:cover|[1-9]\d{0,2})(?:-s)?\.webp)$/;
const WRITING_FILE = /^writing\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const BLOB_ID = /^[0-9a-f]{40}$/;
/** More than this many posts or pieces are ignored (highest numbers first). */
export const MAX_ITEMS = 200;

export type PostFiles = {
  id: string;
  /** Blob id of post.json. */
  json: string;
  /** Image name ("cover", "1-s", ...) to blob id. */
  images: Record<string, string>;
};
export type Manifest = {
  posts: PostFiles[];
  writings: { slug: string; sha: string }[];
};

export function buildManifest(entries: readonly TreeEntry[]): Manifest {
  const posts = new Map<
    string,
    { json?: string; images: Record<string, string> }
  >();
  const writings: { slug: string; sha: string }[] = [];
  for (const { path, sha } of entries) {
    if (!BLOB_ID.test(sha)) continue;
    const post = POST_FILE.exec(path);
    if (post) {
      const entry = posts.get(post[1]) ?? { images: {} };
      if (post[2] === "post.json") entry.json = sha;
      else entry.images[post[2].replace(/\.webp$/, "")] = sha;
      posts.set(post[1], entry);
      continue;
    }
    const piece = WRITING_FILE.exec(path);
    if (piece) writings.push({ slug: piece[1], sha });
  }
  return {
    posts: [...posts]
      .flatMap(([id, { json, images }]) => (json ? [{ id, json, images }] : []))
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, MAX_ITEMS),
    writings: writings
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .slice(0, MAX_ITEMS),
  };
}
