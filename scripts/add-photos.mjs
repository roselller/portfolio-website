// Adds one photo post to the site from a folder of originals.
//
//   node scripts/add-photos.mjs "$HOME/Documents/bnhisu_photography/[17] 18.05.26"
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
// horizontal photos stay horizontal; the cover is always 3:4), resized and
// saved as WebP without metadata (sharp writes none unless asked: no EXIF, no
// GPS, no camera data) in public/photography/<number>/, with a half-size copy
// beside it (name-s.webp) for folder previews and small screens. The post is then listed in src/data/photos.ts;
// open that file to write its `alt` text.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SHORT = 1080;
const LONG = 1440;
// Not HEIC: sharp's ready-made builds cannot read iPhone HEIC files.
const EXTENSIONS = ["jpeg", "jpg", "png", "webp"];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFile = path.join(root, "src", "data", "photos.ts");
const END = "\n];\n";

// A quoted "~/..." reaches us unexpanded, so expand it here.
const folder = process.argv[2]?.replace(/^~(?=\/|$)/, homedir());
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
  try {
    // The size once the camera's orientation flag is applied.
    const meta = await sharp(file).metadata();
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
    // The cover is the folder's preview and the post's first photo: always 3:4.
    const landscape = name !== "cover" && width > height;
    if (landscape) landscapes.push(Number(name));
    const w = landscape ? LONG : SHORT;
    const h = landscape ? SHORT : LONG;
    // Decode, turn upright and crop once; both sizes are encoded from that.
    const { data, info } = await sharp(file)
      .rotate()
      .resize(w, h, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = () =>
      sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      });
    const full = await pixels()
      .webp({ quality: 80 })
      .toFile(path.join(outDir, `${name}.webp`));
    const small = await pixels()
      .resize(w / 2, h / 2)
      .webp({ quality: 78 })
      .toFile(path.join(outDir, `${name}-s.webp`));
    total += full.size + small.size;
    console.log(
      `public/photography/${id}/${name}.webp  ${Math.round(full.size / 1024)} KB  (+ ${Math.round(small.size / 1024)} KB small)${landscape ? "  (landscape)" : ""}`,
    );
  } catch (error) {
    console.error(`Could not read ${file}: ${error.message}`);
    console.error(
      "Nothing was added to src/data/photos.ts. Fix the file and run again.",
    );
    process.exit(1);
  }
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
