import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { marked } from "marked";
import {
  parseWritingFile,
  sortWritings,
  type Writing,
} from "@/lib/writing-file";

// One Markdown file per piece (see docs/writing.md). next.config.ts lists this
// folder in outputFileTracingIncludes so it is also there when a page is
// rebuilt on the server.
const WRITING_DIR = path.join(process.cwd(), "content", "writing");

/** Every piece of writing, newest first. Never throws: no folder, no pieces. */
export const getWritings = cache(async (): Promise<Writing[]> => {
  let names: string[];
  try {
    names = await readdir(WRITING_DIR);
  } catch {
    return [];
  }
  const writings = await Promise.all(
    names
      .filter((name) => name.endsWith(".md"))
      .map(async (name) => {
        try {
          return parseWritingFile(
            name.slice(0, -3),
            await readFile(path.join(WRITING_DIR, name), "utf8"),
          );
        } catch {
          return null;
        }
      }),
  );
  return sortWritings(writings.filter((item) => item !== null));
});

export const getWritingBySlug = cache(async (slug: string) => {
  const writings = await getWritings();
  return { writings, writing: writings.find((item) => item.slug === slug) };
});

/** Markdown to HTML. The result is NOT trusted: render it through SafeHtml. */
export function writingHtml(markdown: string) {
  return marked.parse(markdown, { async: false, gfm: true });
}
