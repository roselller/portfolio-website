import assert from "node:assert/strict";
import test from "node:test";
import { buildManifest, MAX_ITEMS } from "../src/lib/content-manifest";
import { loadContent } from "../src/lib/content-loader";
import {
  githubSource,
  isRepository,
  type ContentSource,
} from "../src/lib/content-source";
import { parsePostFile } from "../src/lib/photo-post-file";

const sha = (n: number) => n.toString(16).padStart(40, "0");

test("manifest keeps only the exact paths it knows", () => {
  const manifest = buildManifest([
    { path: "photography/17/post.json", sha: sha(1) },
    { path: "photography/17/cover.webp", sha: sha(2) },
    { path: "photography/17/cover-s.webp", sha: sha(3) },
    { path: "photography/17/1.webp", sha: sha(4) },
    { path: "photography/17/original.jpg", sha: sha(5) },
    { path: "photography/17/../x/post.json", sha: sha(6) },
    { path: "photography/0017x/post.json", sha: sha(7) },
    { path: "photography/18/cover.webp", sha: sha(8) },
    { path: "writing/my-piece.md", sha: sha(9) },
    { path: "writing/Bad_Name.md", sha: sha(10) },
    { path: "writing/nested/piece.md", sha: sha(11) },
    { path: "README.md", sha: sha(12) },
    { path: "writing/bad-sha.md", sha: "not-a-sha" },
  ]);
  assert.deepEqual(manifest.posts, [
    {
      id: "17",
      json: sha(1),
      images: { cover: sha(2), "cover-s": sha(3), "1": sha(4) },
    },
  ]);
  assert.deepEqual(manifest.writings, [{ slug: "my-piece", sha: sha(9) }]);
});

test("manifest caps posts and pieces, highest post numbers first", () => {
  const entries = Array.from({ length: MAX_ITEMS + 5 }, (_, i) => [
    { path: `photography/${i + 1}/post.json`, sha: sha(i + 1) },
    { path: `writing/piece-${i}.md`, sha: sha(i + 1) },
  ]).flat();
  const manifest = buildManifest(entries);
  assert.equal(manifest.posts.length, MAX_ITEMS);
  assert.equal(manifest.posts[0].id, String(MAX_ITEMS + 5));
  assert.equal(manifest.writings.length, MAX_ITEMS);
});

const files: Record<string, string> = {
  cover: sha(1),
  "cover-s": sha(2),
  "1": sha(3),
  "1-s": sha(4),
};
const good = {
  folder: "[17] 18.05.26",
  title: "A trip",
  hashtags: ["#travel", "food"],
  location: "Old town",
  link: "https://www.instagram.com/p/EXAMPLE/",
  alt: "A street",
  photos: 1,
  landscape: [1],
};
const parse = (data: unknown, images = files) =>
  parsePostFile("17", JSON.stringify(data), images);

test("post.json: a good file becomes a post", () => {
  const post = parse(good);
  assert.ok(post);
  assert.deepEqual(post.hashtags, ["travel", "food"]);
  assert.equal(post.link, "https://www.instagram.com/p/EXAMPLE/");
  assert.deepEqual(post.versions, files);
});

test("post.json: unusable files are dropped", () => {
  assert.equal(parsePostFile("17", "not json", files), null);
  assert.equal(parsePostFile("17", "[]", files), null);
  assert.equal(parse({ ...good, alt: "  " }), null, "no alt text");
  assert.equal(parse({ ...good, title: "" }), null, "no title");
  assert.equal(parse({ ...good, photos: -1 }), null);
  assert.equal(parse({ ...good, photos: 1.5 }), null);
  assert.equal(parse({ ...good, photos: 201 }), null);
  assert.equal(
    parse({ ...good, landscape: [2] }),
    null,
    "landscape out of range",
  );
  assert.equal(parse({ ...good, landscape: [0] }), null);
  assert.equal(parse({ ...good, photos: 2 }), null, "a photo is missing");
  const noSmall = { ...files };
  delete noSmall["1-s"];
  assert.equal(parse(good, noSmall), null, "a half-size copy is missing");
});

test("post.json: links other than Instagram are blanked, text is capped", () => {
  assert.equal(parse({ ...good, link: "https://evil.example/x" })?.link, "");
  assert.equal(parse({ ...good, link: "javascript:alert(1)" })?.link, "");
  assert.equal(parse({ ...good, title: "x".repeat(500) })?.title.length, 200);
});

function fakeSource(
  entries: { path: string; sha: string; text?: string }[],
  failRead?: string,
): ContentSource {
  return {
    async list() {
      return entries.map(({ path, sha }) => ({ path, sha }));
    },
    async readBytes(id) {
      if (id === failRead) throw new Error("network");
      const entry = entries.find((item) => item.sha === id);
      return new TextEncoder().encode(entry?.text ?? "");
    },
  };
}

const post = (id: number, text = JSON.stringify(good)) => [
  { path: `photography/${id}/post.json`, sha: sha(100 + id), text },
  { path: `photography/${id}/cover.webp`, sha: sha(1) },
  { path: `photography/${id}/cover-s.webp`, sha: sha(2) },
  { path: `photography/${id}/1.webp`, sha: sha(3) },
  { path: `photography/${id}/1-s.webp`, sha: sha(4) },
];
const piece = (slug: string, text: string) => ({
  path: `writing/${slug}.md`,
  sha: sha(200 + slug.length),
  text,
});

test("loader: posts latest first, writing newest first, bad files skipped", async () => {
  const content = await loadContent(
    fakeSource([
      ...post(2),
      ...post(9),
      ...post(5, "{ broken"),
      piece("old", "---\ntitle: Old\ndate: 2026-01-01\n---\nText"),
      piece("newer", "---\ntitle: Newer\ndate: 2026-05-01\n---\nText"),
      piece("untitled", "no header"),
    ]),
  );
  assert.deepEqual(
    content.posts.map((p) => p.id),
    ["9", "2"],
  );
  assert.deepEqual(
    content.writings.map((w) => w.slug),
    ["newer", "old"],
  );
  assert.equal(content.writings[0].body, "Text");
});

test("loader: an unreadable list or file fails the whole load", async () => {
  const broken: ContentSource = {
    list: async () => {
      throw new Error("down");
    },
    readBytes: async () => new Uint8Array(),
  };
  await assert.rejects(loadContent(broken));
  await assert.rejects(loadContent(fakeSource(post(1), sha(101))));
});

test("github source: reads the tree and blobs with a bearer token", async () => {
  const calls: { url: string; auth: string | null; accept: string | null }[] =
    [];
  const fetchApi = (async (url: string, init: RequestInit) => {
    const headers = new Headers(init.headers);
    calls.push({
      url,
      auth: headers.get("authorization"),
      accept: headers.get("accept"),
    });
    return url.includes("/trees/")
      ? Response.json({
          truncated: false,
          tree: [
            { path: "writing/a.md", sha: sha(1), type: "blob" },
            { path: "writing", sha: sha(2), type: "tree" },
          ],
        })
      : new Response(new Uint8Array([1, 2, 3]));
  }) as unknown as typeof fetch;
  const source = githubSource("owner/content", "TOKEN", fetchApi);
  assert.deepEqual(await source.list(), [
    { path: "writing/a.md", sha: sha(1) },
  ]);
  assert.deepEqual([...(await source.readBytes(sha(1)))], [1, 2, 3]);
  assert.equal(
    calls[0].url,
    "https://api.github.com/repos/owner/content/git/trees/HEAD?recursive=1",
  );
  assert.ok(calls.every((call) => call.auth === "Bearer TOKEN"));
  assert.equal(calls[1].accept, "application/vnd.github.raw+json");
  await assert.rejects(source.readBytes("../../etc/passwd"));
});

test("github source: refuses odd repository names and failed answers", async () => {
  assert.ok(isRepository("roselller/portfolio-content"));
  assert.ok(
    !isRepository("a/b/c") && !isRepository("../x") && !isRepository(""),
  );
  assert.throws(() => githubSource("../x", "t"));
  const failing = (async () =>
    new Response("no", { status: 403 })) as unknown as typeof fetch;
  await assert.rejects(githubSource("o/r", "t", failing).list());
  const truncated = (async () =>
    Response.json({ truncated: true, tree: [] })) as unknown as typeof fetch;
  await assert.rejects(githubSource("o/r", "t", truncated).list());
});
