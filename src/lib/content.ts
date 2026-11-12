import "server-only";
import { homedir } from "node:os";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { loadContent, type Content } from "@/lib/content-loader";
import {
  folderSource,
  githubSource,
  isRepository,
  type ContentSource,
} from "@/lib/content-source";

const EMPTY: Content = { posts: [], writings: [] };

/**
 * Where the photos and writing live: the private repository in production
 * (CONTENT_REPOSITORY + CONTENT_GITHUB_TOKEN, a read-only token), or a folder
 * on this computer while developing (CONTENT_DIR). Without either there is
 * simply no content.
 */
export function getContentSource(): ContentSource | null {
  const directory = process.env.CONTENT_DIR?.trim().replace(
    /^~(?=\/|$)/,
    homedir(),
  );
  if (process.env.NODE_ENV !== "production" && directory) {
    return folderSource(directory);
  }
  const repository = process.env.CONTENT_REPOSITORY?.trim();
  const token = process.env.CONTENT_GITHUB_TOKEN?.trim();
  return repository && token && isRepository(repository)
    ? githubSource(repository, token)
    : null;
}

async function loadFromSource(): Promise<Content> {
  const source = getContentSource();
  return source ? loadContent(source) : EMPTY;
}

// One hour, like the GitHub projects. A failed load throws, and a thrown
// result is not cached, so the next request tries again.
const loadCached = unstable_cache(loadFromSource, ["portfolio-content-v2"], {
  revalidate: 3600,
});

/** All posts and writing. Never throws: if the store is down, nothing shows. */
export const getContent = cache(async (): Promise<Content> => {
  try {
    return await (process.env.NODE_ENV === "production"
      ? loadCached()
      : loadFromSource());
  } catch (error) {
    // Visible in the host's logs (an expired token shows up here). The message
    // holds no secret: the token is only ever sent in a header.
    console.error(
      "Content store unreadable:",
      error instanceof Error ? error.message : "unknown error",
    );
    return EMPTY;
  }
});
