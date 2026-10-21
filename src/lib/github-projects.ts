import { parse } from "node-html-parser";
import { z } from "zod";
import { sampleProjects, type Project } from "@/data/projects";
import { safeExternalUrl } from "@/lib/utils";

const projectCount = 6;
const usernamePattern = /^[a-z\d](?:[a-z\d-]{0,38})$/i;
const repositoryPattern = /^[a-z\d_.-]{1,100}$/i;
const repositoryPage = z.object({
  payload: z.object({
    sidebarAbout: z.object({ website: z.string().nullable().optional() }),
  }),
});

type PinnedRepository = {
  owner: string;
  name: string;
  description: string;
  language: string;
};

export type ProjectCollection = {
  projects: Project[];
  sample: boolean;
  /** ISO time GitHub's pinned repositories were read; absent for sample-only results. */
  retrievedAt?: string;
};

export function parsePinnedRepositories(html: string): PinnedRepository[] {
  const section = parse(html).querySelector(
    ".js-pinned-items-reorder-container",
  );
  const heading = section?.querySelector("h2")?.text.trim();
  // GitHub uses the same cards for automatically selected popular repositories.
  if (heading?.startsWith("Popular repositories")) return [];
  if (!section || !heading || !/^Pinned\b/.test(heading)) {
    throw new Error("GitHub's pinned section could not be read.");
  }

  const repositories: PinnedRepository[] = [];
  const seen = new Set<string>();
  for (const card of section.querySelectorAll(".js-pinned-item-list-item")) {
    const href = card.querySelector("a[href]")?.getAttribute("href");
    if (!href) throw new Error("A pinned repository link is missing.");
    const url = new URL(href, "https://github.com");
    if (url.hostname === "gist.github.com") continue;
    const [, owner, name, ...extra] = url.pathname.split("/");
    if (
      url.origin !== "https://github.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      extra.length ||
      !owner ||
      !usernamePattern.test(owner) ||
      !name ||
      !repositoryPattern.test(name)
    ) {
      throw new Error("A pinned repository link is invalid.");
    }
    const identity = `${owner}/${name}`.toLowerCase();
    if (seen.has(identity)) continue;
    seen.add(identity);
    repositories.push({
      owner,
      name,
      description:
        card
          .querySelector(".pinned-item-desc")
          ?.text.replace(/\s+/g, " ")
          .trim() || "A public GitHub repository.",
      language:
        card.querySelector('[itemprop="programmingLanguage"]')?.text.trim() ||
        "",
    });
    if (repositories.length === projectCount) break;
  }
  return repositories;
}

export function parseRepositoryHomepage(html: string): string | null {
  const root = parse(html);
  for (const script of root.querySelectorAll(
    'react-app[app-name="code-view"] script[data-target="react-app.embeddedData"]',
  )) {
    try {
      const result = repositoryPage.safeParse(JSON.parse(script.rawText));
      if (result.success) {
        return safeExternalUrl(
          result.data.payload.sidebarAbout.website || null,
        );
      }
    } catch {
      // Older repository pages expose the website in the About sidebar instead.
    }
  }
  const href = root
    .querySelector(".BorderGrid .octicon-link")
    ?.parentNode?.querySelector("a[href]")
    ?.getAttribute("href");
  return safeExternalUrl(href || null);
}

export function withSampleProjects(
  pinned: readonly Project[],
): ProjectCollection {
  const projects = pinned.slice(0, projectCount).map((project, signOrder) => ({
    ...project,
    signOrder,
    isSample: false,
  }));
  const usedSlugs = new Set(projects.map((project) => project.slug));
  for (const project of sampleProjects) {
    if (projects.length === projectCount) break;
    if (usedSlugs.has(project.slug)) continue;
    usedSlugs.add(project.slug);
    projects.push({ ...project, signOrder: projects.length, isSample: true });
  }
  return { projects, sample: projects.some((project) => project.isSample) };
}

/** Called only by the server-side cached collection; fetch is injectable for tests. */
export async function loadGitHubProjects(
  username: string,
  fetchPage: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<ProjectCollection> {
  if (!usernamePattern.test(username)) return withSampleProjects([]);
  const signal = AbortSignal.timeout(timeoutMs);
  const readPage = async (url: string) => {
    const response = await fetchPage(url, {
      cache: "no-store",
      signal,
      headers: {
        Accept: "text/html",
        "Accept-Language": "en",
        "User-Agent": "Portfolio-Pinned-Repositories",
      },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      throw new Error("GitHub's public page is unavailable.");
    }
    return response.text();
  };

  try {
    const repositories = parsePinnedRepositories(
      await readPage(`https://github.com/${username}`),
    );
    const projects = await Promise.all(
      repositories.map(async (repository, signOrder): Promise<Project> => {
        const { owner, name, description, language } = repository;
        const repoUrl = `https://github.com/${owner}/${name}`;
        let projectUrl = repoUrl;
        try {
          projectUrl =
            parseRepositoryHomepage(await readPage(repoUrl)) || repoUrl;
        } catch {
          // Homepage enrichment is optional; keep the successfully discovered pin.
        }
        return {
          id: `github:${owner}/${name}`.toLowerCase(),
          // Owners cannot contain underscores, so this separator is unambiguous.
          slug: `github-${owner}__${name}`.toLowerCase(),
          title: name,
          shortDescription: description,
          description,
          techStack: language ? [language] : [],
          thumbnailUrl: null,
          projectUrl,
          repoUrl,
          signOrder,
          isSample: false,
        };
      }),
    );
    const collection = withSampleProjects(projects);
    // Recorded here, inside the cached loader, so the time stays tied to the
    // data however long the cached result is reused. Sample-only results have
    // nothing retrieved, so they carry no time.
    return projects.length
      ? { ...collection, retrievedAt: new Date().toISOString() }
      : collection;
  } catch {
    return withSampleProjects([]);
  }
}
