// Adds one photo post to the site from a folder of originals.
//
//   node scripts/add-photos.mjs "~/Documents/bnhisu_photography/[17] 18.05.26"
//
// The folder is named "[number] date" and holds cover.(jpeg|jpg|png) plus the
// post's other photos as 1.png, 2.png, ... (no gaps), and optionally a
// content.md with lines like:
//
//   TITLE:A trip
//   HASHTAGS:#travel,#taiwan
//   LOCATION:Old town
//   LINK:https://www.instagram.com/p/.../
//
// The number becomes the post's id and address (/photos/17), the folder name
// its label on the Work page; a higher number is a later post.
//
// Every photo is turned upright, cropped to 3:4 (portrait) or 4:3 (landscape:
// horizontal photos stay horizontal), resized and saved as WebP without
// metadata (sharp writes none unless asked: no EXIF, no GPS, no camera data) in
// public/photography/<number>/. The post is then listed in src/data/photos.ts;
// open that file to write its `alt` text.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SHORT = 1080;
const LONG = 1440;
const EXTENSIONS = ["jpeg", "jpg", "png", "webp", "heic"];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFile = path.join(root, "src", "data", "photos.ts");
const END = "\n];\n";

const folder = process.argv[2];
const label = path.basename(folder ?? "").trim();
const id = /^\[(\d+)\]/.exec(label)?.[1];
if (!folder || !id) {
  console.error(
    'Usage: node scripts/add-photos.mjs "<folder named [number] ...>"',
  );
  process.exit(1);
}
const find = (name) =>
  EXTENSIONS.map((ext) => path.join(folder, `${name}.${ext}`)).find((file) =>
    existsSync(file),
  );
const cover = find("cover");
if (!cover) {
  console.error(`No cover.(${EXTENSIONS.join("|")}) in ${folder}`);
  process.exit(1);
}
const files = [["cover", cover]];
for (let n = 1; find(String(n)); n++) files.push([String(n), find(String(n))]);

let data = readFileSync(dataFile, "utf8").replace(
  "export const localPosts: PhotoPost[] = [];",
  "export const localPosts: PhotoPost[] = [\n];",
);
const listed = data.includes(`id: "${id}"`);
if (!listed && !data.endsWith(END)) {
  console.error(
    `${dataFile} does not end with its list; add the post by hand.`,
  );
  process.exit(1);
}

const outDir = path.join(root, "public", "photography", id);
mkdirSync(outDir, { recursive: true });
let total = 0;
const landscapes = [];
for (const [name, file] of files) {
  // Upright first (the camera's orientation flag), then sized by its shape.
  const upright = await sharp(file)
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const landscape = upright.info.width > upright.info.height;
  if (landscape && name !== "cover") landscapes.push(Number(name));
  const info = await sharp(upright.data)
    .resize(landscape ? LONG : SHORT, landscape ? SHORT : LONG, {
      fit: "cover",
    })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, `${name}.webp`));
  total += info.size;
  console.log(
    `public/photography/${id}/${name}.webp  ${Math.round(info.size / 1024)} KB${landscape ? "  (landscape)" : ""}`,
  );
}
console.log(`${files.length} photos, ${(total / 1048576).toFixed(1)} MB`);

// content.md: KEY:value lines (TITLE, HASHTAGS separated by commas, LOCATION,
// LINK).
const content = {};
const contentFile = path.join(folder, "content.md");
if (existsSync(contentFile)) {
  for (const line of readFileSync(contentFile, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
    if (match) content[match[1].toUpperCase()] = match[2].trim();
  }
}
const hashtags = (content.HASHTAGS ?? "")
  .split(",")
  .map((tag) => tag.trim().replace(/^#/, ""))
  .filter(Boolean);
const entry = `  {
    id: "${id}",
    folder: ${JSON.stringify(label)},
    title: ${JSON.stringify(content.TITLE || label)},
    hashtags: ${JSON.stringify(hashtags)},
    location: ${JSON.stringify(content.LOCATION || "")},
    link: ${JSON.stringify(content.LINK || "")},
    alt: "",
    photos: ${files.length - 1},
    landscape: ${JSON.stringify(landscapes)},
  },`;

if (listed) {
  console.log(
    `Post ${id} is already in src/data/photos.ts. Update it by hand from:\n${entry}`,
  );
} else {
  writeFileSync(dataFile, data.slice(0, -END.length) + "\n" + entry + END);
  console.log("Now write the alt text in src/data/photos.ts.");
}
