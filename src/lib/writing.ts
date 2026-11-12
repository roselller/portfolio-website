import "server-only";
import { cache } from "react";
import { marked } from "marked";
import { getContent } from "@/lib/content";
import type { Writing } from "@/lib/writing-file";

// The pieces are Markdown files in the content repository (docs/writing.md).

/** Every piece of writing, newest first. Never throws: no store, no pieces. */
export const getWritings = cache(
  async (): Promise<Writing[]> => (await getContent()).writings,
);

export const getWritingBySlug = cache(async (slug: string) => {
  const writings = await getWritings();
  return { writings, writing: writings.find((item) => item.slug === slug) };
});

/** Markdown to HTML. The result is NOT trusted: render it through SafeHtml. */
export function writingHtml(markdown: string) {
  return marked.parse(markdown, { async: false, gfm: true });
}
