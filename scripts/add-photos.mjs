// Adds photos to the Work page's photo scene (used when Instagram is not
// connected). Each file is cropped to the print's 4:5 shape, resized, and
// re-encoded without any metadata (sharp writes none unless asked: no EXIF, no
// GPS, no camera data), then listed in src/data/photos.ts.
//
//   node scripts/add-photos.mjs ~/Pictures/one.jpg ~/Pictures/two.jpg
//
// Afterwards, open src/data/photos.ts and write each new photo's `alt` text
// and, if you like, the Instagram post it should link to (`href`).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public", "photos");
const dataFile = path.join(root, "src", "data", "photos.ts");
const END = "\n];\n";

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: node scripts/add-photos.mjs <photo> [<photo> ...]");
  process.exit(1);
}

let data = readFileSync(dataFile, "utf8").replace(
  "export const localPhotos: Photo[] = [];",
  "export const localPhotos: Photo[] = [\n];",
);
if (!data.endsWith(END)) {
  console.error(`${dataFile} does not end with its list; add entries by hand.`);
  process.exit(1);
}

for (const input of inputs) {
  const base = path
    .basename(input, path.extname(input))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let id = base || "photo";
  for (let n = 2; existsSync(path.join(outDir, `${id}.jpg`)); n++) {
    id = `${base || "photo"}-${n}`;
  }
  await sharp(input)
    .rotate() // apply the camera's orientation before the metadata is dropped
    .resize(1080, 1350, { fit: "cover", position: "attention" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(outDir, `${id}.jpg`));
  data =
    data.slice(0, -END.length) +
    `\n  { id: "${id}", src: "/photos/${id}.jpg", alt: "", href: null },` +
    END;
  console.log(`Added public/photos/${id}.jpg`);
}
writeFileSync(dataFile, data);
console.log("Now write the alt text (and links) in src/data/photos.ts.");
