// Adds one photo post to the site from a folder of originals.
//
//   node scripts/add-photos.mjs "~/Documents/bnhisu_photography/[17] 18.05.26"
//
// The folder is named "[number] date" and holds cover.(jpeg|jpg|png) plus the
// post's other photos as 1.png, 2.png, ... (no gaps). The folder name becomes
// the post's title and the number its id and address (/photos/17); a higher
// number is a later post and is shown first.
//
// Every photo is turned upright (a landscape photo is turned 90 degrees
// clockwise so the whole post is portrait), cropped to 3:4, resized and saved
// as WebP without metadata (sharp writes none unless asked: no EXIF, no GPS,
// no camera data) in public/photography/<number>/. The post is then listed in
// src/data/photos.ts; open that file to write its `alt` text.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1440;
const EXTENSIONS = ["jpeg", "jpg", "png", "webp", "heic"];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFile = path.join(root, "src", "data", "photos.ts");
const END = "\n];\n";

const folder = process.argv[2];
const title = path.basename(folder ?? "").trim();
const id = /^\[(\d+)\]/.exec(title)?.[1];
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
for (const [name, file] of files) {
  // Upright first (the camera's orientation flag), then landscape to portrait.
  const upright = await sharp(file)
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const landscape = upright.info.width > upright.info.height;
  const info = await sharp(upright.data)
    .rotate(landscape ? 90 : 0)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, `${name}.webp`));
  total += info.size;
  console.log(
    `public/photography/${id}/${name}.webp  ${Math.round(info.size / 1024)} KB${landscape ? "  (turned)" : ""}`,
  );
}
console.log(`${files.length} photos, ${(total / 1048576).toFixed(1)} MB`);

if (listed) {
  console.log(
    `Post ${id} is already in src/data/photos.ts: check its \`photos\` count is ${files.length - 1}.`,
  );
} else {
  data =
    data.slice(0, -END.length) +
    `\n  {\n    id: "${id}",\n    title: ${JSON.stringify(title)},\n    alt: "",\n    photos: ${files.length - 1},\n  },` +
    END;
  writeFileSync(dataFile, data);
  console.log("Now write the alt text in src/data/photos.ts.");
}
