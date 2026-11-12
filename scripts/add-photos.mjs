// Adds one post to the Work page's photo scene from a folder of originals.
//
//   node scripts/add-photos.mjs "~/Documents/bnhisu_photography/[17] 18.05.26"
//
// The folder is named "[number] date" and holds cover.(jpeg|jpg|png) plus the
// post's other photos as 1.png, 2.png, ... The number becomes the post's id
// (a higher number is a later post and is shown first). Only the cover and
// the first FAN_COUNT photos are used: the cover is the print, the others fan
// out behind it under the pointer.
//
// Every file is cropped to the print's 4:5 shape, resized and re-encoded
// without metadata (sharp writes none unless asked: no EXIF, no GPS, no camera
// data), then the post is listed in src/data/photos.ts. Afterwards open that
// file to write the post's `alt` text and, if you like, the Instagram post it
// links to (`href`).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FAN_COUNT = 2;
const EXTENSIONS = ["jpeg", "jpg", "png", "webp", "heic"];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFile = path.join(root, "src", "data", "photos.ts");
const END = "\n];\n";

const folder = process.argv[2];
const id = /^\[(\d+)\]/.exec(path.basename(folder ?? ""))?.[1];
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
const fan = [];
for (let n = 1; n <= FAN_COUNT; n++) {
  const file = find(String(n));
  if (file) fan.push([String(n), file]);
}

let data = readFileSync(dataFile, "utf8").replace(
  "export const localPhotos: Photo[] = [];",
  "export const localPhotos: Photo[] = [\n];",
);
if (!data.endsWith(END)) {
  console.error(
    `${dataFile} does not end with its list; add the post by hand.`,
  );
  process.exit(1);
}
if (data.includes(`id: "${id}"`)) {
  console.error(`Post ${id} is already listed in ${dataFile}.`);
  process.exit(1);
}

const outDir = path.join(root, "public", "photos", id);
mkdirSync(outDir, { recursive: true });
for (const [name, file] of [["cover", cover], ...fan]) {
  const info = await sharp(file)
    .rotate() // apply the camera's orientation before the metadata is dropped
    .resize(800, 1000, { fit: "cover" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(outDir, `${name}.jpg`));
  console.log(
    `public/photos/${id}/${name}.jpg  ${Math.round(info.size / 1024)} KB`,
  );
}
const fanList = fan.map(([name]) => `"/photos/${id}/${name}.jpg"`).join(", ");
data =
  data.slice(0, -END.length) +
  `\n  {\n    id: "${id}",\n    src: "/photos/${id}/cover.jpg",\n    alt: "",\n    href: null,\n    fan: [${fanList}],\n  },` +
  END;
writeFileSync(dataFile, data);
console.log("Now write the alt text (and link) in src/data/photos.ts.");
