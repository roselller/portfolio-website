import assert from "node:assert/strict";
import test from "node:test";
import { folderDate, workPath } from "../src/lib/work-path";
import {
  instagramPostUrl,
  isPostId,
  postImages,
  postToFolder,
  sortPosts,
  toFolders,
} from "../src/lib/photo-posts";

const folderPost = {
  id: "17",
  folder: "[17] 18.05.26",
  title: "Postcards",
  hashtags: ["travel"],
  location: "",
  link: "",
  alt: "A bookshop",
  photos: 3,
  landscape: [2],
};
const portrait = { width: 1080, height: 1440 };
const landscape = { width: 1440, height: 1080 };

test("a post lists its cover and then its numbered photos, each in its shape", () => {
  assert.deepEqual(postImages(folderPost), [
    {
      src: "/photography/17/cover.webp",
      small: "/photography/17/cover-s.webp",
      alt: "A bookshop",
      ...portrait,
    },
    {
      src: "/photography/17/1.webp",
      small: "/photography/17/1-s.webp",
      alt: "Photo 2 of 4 from Postcards",
      ...portrait,
    },
    {
      src: "/photography/17/2.webp",
      small: "/photography/17/2-s.webp",
      alt: "Photo 3 of 4 from Postcards",
      ...landscape,
    },
    {
      src: "/photography/17/3.webp",
      small: "/photography/17/3-s.webp",
      alt: "Photo 4 of 4 from Postcards",
      ...portrait,
    },
  ]);
  assert.equal(postImages({ ...folderPost, photos: 0 }).length, 1);
  assert.equal(postImages({ ...folderPost, photos: -2 }).length, 1);
});

test("on the Work page a post is a folder with three small preview photos", () => {
  assert.deepEqual(postToFolder(folderPost), {
    id: "17",
    title: "[17] 18.05.26",
    href: "/photos/17",
    previews: [
      "/photography/17/cover-s.webp",
      "/photography/17/1-s.webp",
      "/photography/17/2-s.webp",
    ],
  });
  assert.equal(postToFolder({ ...folderPost, photos: 1 }).previews.length, 2);
});

test("folders are listed by number, lowest first", () => {
  const ids = toFolders(
    ["2", "17", "9", "bad", "10"].map((id) => ({ ...folderPost, id })),
  ).map((item) => item.id);
  assert.deepEqual(ids, ["2", "9", "10", "17"]);
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

test("sub-pages are labelled like folders on disk", () => {
  assert.equal(
    workPath("projects", 1, "portfolio-website"),
    "~/PROJECTS/01_portfolio-website/",
  );
  assert.equal(
    workPath("photography", 17, folderDate("[17] 18.05.26")),
    "~/PHOTOGRAPHY/17_18.05.26/",
  );
  assert.equal(
    workPath("projects", 12, " My  Big/Project "),
    "~/PROJECTS/12_My-Big-Project/",
  );
  assert.equal(folderDate("no number"), "no number");
});

test("only an https instagram.com address is linked from a post", () => {
  assert.equal(
    instagramPostUrl("https://www.instagram.com/p/EXAMPLE_ID_1/"),
    "https://www.instagram.com/p/EXAMPLE_ID_1/",
  );
  for (const bad of [
    "",
    "http://www.instagram.com/p/x/",
    "https://instagram.com.evil.example/p/x/",
    "https://user:pw@www.instagram.com/p/x/",
    "javascript:alert(1)",
    "/p/x/",
  ]) {
    assert.equal(instagramPostUrl(bad), null, bad);
  }
});
