// Where the content comes from: a private GitHub repository in production, a
// folder on this computer while developing (CONTENT_DIR, never in production).
// No environment variables are read here; src/lib/content.ts passes them in.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { TreeEntry } from "@/lib/content-manifest";

export type ContentSource = {
  /** Every file: its path and its blob id (git's id for the file's bytes). */
  list(): Promise<TreeEntry[]>;
  readBytes(sha: string): Promise<Uint8Array>;
};

// GitHub owner names have no dots or underscores; "." and ".." are no repository.
const REPOSITORY =
  /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/;
const BLOB_ID = /^[0-9a-f]{40}$/;
const MAX_BYTES = 8 * 1024 * 1024;

export function isRepository(value: string) {
  return REPOSITORY.test(value);
}

/** The private content repository, read with a read-only token. */
export function githubSource(
  repository: string,
  token: string,
  fetchApi: typeof fetch = fetch,
  timeoutMs = 8000,
): ContentSource {
  if (!REPOSITORY.test(repository)) throw new Error("Invalid repository.");
  const call = async (url: string, accept: string) => {
    const response = await fetchApi(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Portfolio-Content",
      },
    });
    if (!response.ok)
      throw new Error(`Content store answered ${response.status}.`);
    return response;
  };
  const api = `https://api.github.com/repos/${repository}/git`;
  return {
    async list() {
      const response = await call(
        `${api}/trees/HEAD?recursive=1`,
        "application/vnd.github+json",
      );
      const tree = (await response.json()) as {
        truncated?: boolean;
        tree?: { path?: unknown; sha?: unknown; type?: unknown }[];
      };
      if (tree.truncated || !Array.isArray(tree.tree))
        throw new Error("The content list is incomplete.");
      return tree.tree.flatMap((item) =>
        item.type === "blob" &&
        typeof item.path === "string" &&
        typeof item.sha === "string"
          ? [{ path: item.path, sha: item.sha }]
          : [],
      );
    },
    async readBytes(sha) {
      if (!BLOB_ID.test(sha)) throw new Error("Invalid blob id.");
      const response = await call(
        `${api}/blobs/${sha}`,
        "application/vnd.github.raw+json",
      );
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > MAX_BYTES) throw new Error("File too large.");
      return bytes;
    },
  };
}

/** A folder on this computer laid out like the repository (development only). */
export function folderSource(directory: string): ContentSource {
  const byId = new Map<string, string>();
  const gitId = (bytes: Buffer) =>
    createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex");
  const source: ContentSource = {
    async list() {
      byId.clear();
      const entries: TreeEntry[] = [];
      const walk = async (relative: string) => {
        for (const item of await readdir(path.join(directory, relative), {
          withFileTypes: true,
        })) {
          const next = relative ? `${relative}/${item.name}` : item.name;
          if (item.isDirectory()) {
            if (!item.name.startsWith(".")) await walk(next);
          } else if (item.isFile()) {
            const file = path.join(directory, next);
            const sha = gitId(await readFile(file));
            byId.set(sha, file);
            entries.push({ path: next, sha });
          }
        }
      };
      await walk("");
      return entries;
    },
    async readBytes(sha) {
      // A fresh source (the image route makes its own) has not listed yet.
      if (!byId.has(sha)) await source.list();
      const file = byId.get(sha);
      if (!file) throw new Error("Unknown file.");
      return new Uint8Array(await readFile(file));
    },
  };
  return source;
}
