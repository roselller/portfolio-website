import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { loadGitHubReadme } from "@/lib/github-readme";
import {
  loadGitHubProjects,
  withSampleProjects,
  type ProjectCollection,
} from "@/lib/github-projects";

// Cache the entire result, including empty/error fallback, for one hour.
// This project does not enable Cache Components; use its existing cache model.
const getCachedGitHubProjects = unstable_cache(
  (username: string) => loadGitHubProjects(username),
  ["github-pinned-projects-v3"],
  { revalidate: 3600 },
);

const getCachedGitHubReadme = unstable_cache(
  (repositoryUrl: string) => loadGitHubReadme(repositoryUrl),
  ["github-readme-v1"],
  { revalidate: 3600 },
);

export const getProjectReadme = cache(async (repositoryUrl: string) => {
  try {
    return await getCachedGitHubReadme(repositoryUrl);
  } catch {
    return null;
  }
});

export const getProjectCollection = cache(
  async (): Promise<ProjectCollection> => {
    try {
      return await getCachedGitHubProjects(
        process.env.GITHUB_USERNAME?.trim().toLowerCase() || "",
      );
    } catch {
      // A cache-service failure must not prevent the homepage from rendering.
      return withSampleProjects([]);
    }
  },
);

export const getProjectBySlug = cache(async (slug: string) => {
  const collection = await getProjectCollection();
  const project = collection.projects.find((project) => project.slug === slug);
  return {
    ...collection,
    project,
    sample: project?.isSample ?? collection.sample,
  };
});
