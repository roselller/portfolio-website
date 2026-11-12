// Reads the whole content folder (CONTENT_DIR) with the website's own loader
// and reports what the site would show. Run it before you push the content.
import { config } from "dotenv";
import { homedir } from "node:os";
import { loadContent } from "../src/lib/content-loader";
import { folderSource } from "../src/lib/content-source";

config({ path: ".env.local", quiet: true });
const dir = process.env.CONTENT_DIR?.trim().replace(/^~(?=\/|$)/, homedir());
if (!dir) {
  console.error(
    "Set CONTENT_DIR in .env.local to your clone of the content repository.",
  );
  process.exit(1);
}
async function main(directory: string) {
  const { posts, writings } = await loadContent(folderSource(directory));
  console.log(`${posts.length} photo post(s):`);
  for (const post of posts)
    console.log(`  ${post.id}  ${post.title}  (${post.photos + 1} photos)`);
  console.log(`${writings.length} piece(s) of writing:`);
  for (const piece of writings) console.log(`  ${piece.slug}  ${piece.title}`);
}

main(dir).catch((error) => {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
});
