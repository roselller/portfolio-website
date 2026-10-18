import type { MetadataRoute } from "next";
import { getProjectCollection } from "@/lib/projects";
import { getSiteUrl } from "@/lib/site-url";

// Same cadence as the home page, so newly pinned repositories appear within an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  // Cached and never throws: falls back to the sample projects when GitHub is unreachable.
  const { projects } = await getProjectCollection();
  return [
    { url: origin, priority: 1 },
    { url: `${origin}/about`, priority: 0.8 },
    { url: `${origin}/contact`, priority: 0.6 },
    ...projects.map(({ slug }) => ({
      url: `${origin}/projects/${encodeURIComponent(slug)}`,
      priority: 0.7,
    })),
  ];
}
