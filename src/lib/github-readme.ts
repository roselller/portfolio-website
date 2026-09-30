import { parse } from "node-html-parser";

const repositoryUrlPattern =
  /^https:\/\/github\.com\/[a-z\d](?:[a-z\d-]{0,38})\/[a-z\d_.-]{1,100}$/i;

/** GitHub renders the default-branch README on the public repository page. */
export function parseRepositoryReadme(html: string): string | null {
  return (
    parse(html).querySelector("article.markdown-body")?.innerHTML.trim() || null
  );
}

export async function loadGitHubReadme(
  repositoryUrl: string,
  fetchPage: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<string | null> {
  if (!repositoryUrlPattern.test(repositoryUrl)) return null;
  try {
    const response = await fetchPage(repositoryUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "text/html",
        "Accept-Language": "en",
        "User-Agent": "Portfolio-Pinned-Repositories",
      },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    )
      return null;
    return parseRepositoryReadme(await response.text());
  } catch {
    // The repository description and link still make a useful project brief.
    return null;
  }
}
