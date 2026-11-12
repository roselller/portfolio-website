import assert from "node:assert/strict";
import test from "node:test";
import {
  PHOTO_LIMIT,
  captionAlt,
  parseInstagramMedia,
  pickInstagramAccount,
  tokenSeed,
} from "../src/lib/instagram";
import {
  isPostId,
  postImages,
  postToPhoto,
  sortPosts,
} from "../src/lib/photo-posts";

const handle = "bnhisu.jpg";
const post = (id: number, extra: Record<string, unknown> = {}) => ({
  id: String(id),
  media_type: "IMAGE",
  media_url: `https://scontent.cdninstagram.com/v/${id}.jpg?sig=abc`,
  permalink: `https://www.instagram.com/p/POST${id}/`,
  caption: `Golden hour #${id}`,
  timestamp: "2026-10-01T10:00:00+0000",
  ...extra,
});

test("Instagram posts become photos that link to their post", () => {
  assert.deepEqual(parseInstagramMedia({ data: [post(1)] }, handle), [
    {
      id: "1",
      src: "https://scontent.cdninstagram.com/v/1.jpg?sig=abc",
      alt: "Golden hour",
      href: "https://www.instagram.com/p/POST1/",
      fan: [],
    },
  ]);
});

test("albums use their cover and videos their thumbnail", () => {
  const photos = parseInstagramMedia(
    {
      data: [
        post(1, { media_type: "CAROUSEL_ALBUM" }),
        post(2, {
          media_type: "VIDEO",
          media_url: "https://video.cdninstagram.com/2.mp4",
          thumbnail_url: "https://scontent.cdninstagram.com/v/2-thumb.jpg",
        }),
        // A video without a thumbnail has no picture to show.
        post(3, { media_type: "VIDEO", thumbnail_url: undefined }),
      ],
    },
    handle,
  );
  assert.deepEqual(
    photos.map((photo) => photo.src),
    [
      "https://scontent.cdninstagram.com/v/1.jpg?sig=abc",
      "https://scontent.cdninstagram.com/v/2-thumb.jpg",
    ],
  );
});

test("malformed posts are skipped and unsafe addresses never pass", () => {
  const photos = parseInstagramMedia(
    {
      data: [
        null,
        "text",
        { id: "abc", media_type: "IMAGE", media_url: "https://a.b/c.jpg" },
        post(4, { media_url: "http://insecure.example/4.jpg" }),
        post(5, { media_url: "javascript:alert(1)" }),
        post(6, { media_url: undefined }),
        post(7, { media_type: "STORY" }),
        post(8, { permalink: "https://evil.example/p/8/" }),
        post(9, { permalink: "javascript:alert(1)", caption: undefined }),
      ],
    },
    handle,
  );
  assert.deepEqual(photos, [
    {
      id: "8",
      src: "https://scontent.cdninstagram.com/v/8.jpg?sig=abc",
      alt: "Golden hour",
      href: null,
      fan: [],
    },
    {
      id: "9",
      src: "https://scontent.cdninstagram.com/v/9.jpg?sig=abc",
      alt: "Photo by @bnhisu.jpg on Instagram",
      href: null,
      fan: [],
    },
  ]);
});

test("an answer that is not a media list is an error, and the list is capped", () => {
  assert.throws(() => parseInstagramMedia({ error: { message: "x" } }, handle));
  assert.throws(() => parseInstagramMedia(null, handle));
  const many = Array.from({ length: 30 }, (_, index) => post(index + 1));
  assert.equal(parseInstagramMedia({ data: many }, handle).length, PHOTO_LIMIT);
});

test("alt text is the caption's first line without hashtags, kept short", () => {
  assert.equal(
    captionAlt("Rain in Tiong Bahru\n\n#sg #street", handle),
    "Rain in Tiong Bahru",
  );
  assert.equal(
    captionAlt("  #only #tags ", handle),
    "Photo by @bnhisu.jpg on Instagram",
  );
  const long = captionAlt("word ".repeat(60), handle);
  assert.ok(long.length <= 140 && long.endsWith("…"));
});

test("the account named in the profile is picked, else the first", () => {
  const data = [
    { id: "17840000000000001", username: "other" },
    { id: "17840000000000002", username: "BNHISU.jpg" },
  ];
  assert.equal(pickInstagramAccount({ data }, handle), "17840000000000002");
  assert.equal(pickInstagramAccount({ data }, "nobody"), "17840000000000001");
  assert.equal(
    pickInstagramAccount({ data: [{ id: "17840000000000003" }] }, handle),
    "17840000000000003",
  );
  assert.throws(() => pickInstagramAccount({ data: [] }, handle));
  assert.throws(() =>
    pickInstagramAccount({ data: [{ id: "../me" }] }, handle),
  );
  assert.throws(() => pickInstagramAccount({ error: {} }, handle));
});

test("the cache fingerprint never contains the token", () => {
  const token = "EAAB-system-user-token-0001";
  assert.equal(tokenSeed(token).length, 16);
  assert.ok(!tokenSeed(token).includes(token.slice(0, 8)));
  assert.notEqual(tokenSeed(token), tokenSeed(token + "x"));
});

const folderPost = {
  id: "17",
  title: "[17] 18.05.26",
  alt: "A bookshop",
  photos: 3,
};

test("a post lists its cover and then its numbered photos", () => {
  assert.deepEqual(postImages(folderPost), [
    { src: "/photography/17/cover.webp", alt: "A bookshop" },
    { src: "/photography/17/1.webp", alt: "Photo 1 of 3 from [17] 18.05.26" },
    { src: "/photography/17/2.webp", alt: "Photo 2 of 3 from [17] 18.05.26" },
    { src: "/photography/17/3.webp", alt: "Photo 3 of 3 from [17] 18.05.26" },
  ]);
  assert.equal(postImages({ ...folderPost, photos: 0 }).length, 1);
  assert.equal(postImages({ ...folderPost, photos: -2 }).length, 1);
});

test("on the Work page a post is its cover, its page and two fan photos", () => {
  assert.deepEqual(postToPhoto(folderPost), {
    id: "17",
    src: "/photography/17/cover.webp",
    alt: "A bookshop",
    href: "/photos/17",
    fan: ["/photography/17/1.webp", "/photography/17/2.webp"],
  });
  assert.deepEqual(postToPhoto({ ...folderPost, photos: 1 }).fan, [
    "/photography/17/1.webp",
  ]);
});

test("posts are listed latest first and bad ids are dropped", () => {
  const ids = sortPosts(
    ["2", "17", "9", "../x", "", "1e3", "10"].map((id) => ({
      ...folderPost,
      id,
    })),
  ).map((item) => item.id);
  assert.deepEqual(ids, ["17", "10", "9", "2"]);
  assert.ok(isPostId("17") && !isPostId("17/") && !isPostId("-1"));
});
