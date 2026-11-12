// Adds one photo post to the CONTENT repository (not to this website's repo).
//
//   pnpm photos:add "$HOME/Documents/bnhisu_photography/[17] 18.05.26"
//
// CONTENT_DIR (in .env.local) is your clone of the private content repository.
// The folder is named "[number] date" and holds cover.(jpeg|jpg|png|webp) plus
// the post's other photos as 1.png, 2.png, ... (no gaps), and a content.md:
//
//   TITLE:A trip
//   HASHTAGS:#travel,#food
//   LOCATION:Old town
//   LINK:https://www.instagram.com/p/.../
//   ALT:What the cover shows, for people who cannot see it.   (required)
//
// The number becomes the post's id and address (/photos/17). Every photo is
// turned upright, cropped to 3:4 (portrait) or 4:3 (landscape; the cover is
// always 3:4), resized and saved as WebP, with a half-size copy (name-s.webp).
// sharp writes no metadata unless asked; each output is read back and refused
// if it still carries EXIF, XMP or IPTC (that is where GPS lives). Nothing is
// written to the content folder unless every photo passed.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { config } from "dotenv";
import sharp from "sharp";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const SHORT = 1080;
const LONG = 1440;
// Not HEIC: sharp's ready-made builds cannot read iPhone HEIC files.
const EXTENSIONS = ["jpeg", "jpg", "png", "webp"];
const expand = (value) => value?.replace(/^~(?=\/|$)/, homedir());
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const folder = expand(process.argv[2]);
const contentDir = expand(process.env.CONTENT_DIR?.trim());
const label = path.basename(folder ?? "").trim();
const id = /^\[(\d{1,6})\]/.exec(label)?.[1];
if (!folder || !id)
  fail('Usage: pnpm photos:add "<folder named [number] ...>"');
if (!contentDir || !existsSync(contentDir))
  fail(
    "Set CONTENT_DIR in .env.local to your clone of the content repository.",
  );

const find = (name) =>
  EXTENSIONS.map((ext) => path.join(folder, `${name}.${ext}`)).find((file) =>
    existsSync(file),
  );
const cover = find("cover");
if (!cover) fail(`No cover.(${EXTENSIONS.join("|")}) in ${folder}`);
const files = [["cover", cover]];
for (let n = 1; find(String(n)); n++) files.push([String(n), find(String(n))]);

// content.md: KEY:value lines.
const content = {};
const contentFile = path.join(folder, "content.md");
if (existsSync(contentFile)) {
  for (const line of readFileSync(contentFile, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
    if (match) content[match[1].toUpperCase()] = match[2].trim();
  }
}
if (!content.ALT)
  fail(`Add an ALT: line to ${contentFile} (what the cover shows).`);

const tmp = path.join(contentDir, "photography", `.tmp-${id}-${process.pid}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
let total = 0;
const landscapes = [];
try {
  for (const [name, file] of files) {
    const meta = await sharp(file).metadata();
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
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
    const outputs = [
      [`${name}.webp`, pixels().webp({ quality: 80 })],
      [
        `${name}-s.webp`,
        pixels()
          .resize(w / 2, h / 2)
          .webp({ quality: 78 }),
      ],
    ];
    for (const [fileName, pipeline] of outputs) {
      const target = path.join(tmp, fileName);
      const written = await pipeline.toFile(target);
      total += written.size;
      const check = await sharp(target).metadata();
      if (check.exif || check.xmp || check.iptc || check.tifftagPhotoshop)
        throw new Error(
          `${fileName} still carries metadata; nothing was added.`,
        );
    }
    console.log(`${name}.webp${landscape ? "  (landscape)" : ""}`);
  }
} catch (error) {
  rmSync(tmp, { recursive: true, force: true });
  fail(`Could not add the post: ${error.message}`);
}

const hashtags = (content.HASHTAGS ?? "")
  .split(",")
  .map((tag) => tag.trim().replace(/^#/, ""))
  .filter(Boolean);
writeFileSync(
  path.join(tmp, "post.json"),
  JSON.stringify(
    {
      folder: label,
      title: content.TITLE || label,
      hashtags,
      location: content.LOCATION || "",
      link: content.LINK || "",
      alt: content.ALT,
      photos: files.length - 1,
      landscape: landscapes,
    },
    null,
    2,
  ) + "\n",
);
const finalDir = path.join(contentDir, "photography", id);
rmSync(finalDir, { recursive: true, force: true });
renameSync(tmp, finalDir);
console.log(
  `${files.length} photos, ${(total / 1048576).toFixed(1)} MB, no metadata -> ${finalDir}`,
);
console.log(
  `\nNext, in the content repository:\n  cd "${contentDir}" && git add photography/${id} && git commit -m "Post ${id}" && git push`,
);
