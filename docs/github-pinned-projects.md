# GitHub project data

## Source and configuration

Set `GITHUB_USERNAME` in the server environment. `src/lib/projects.ts` is the server-only entry point for project collections and README content. The application requires no GitHub token, GraphQL connection, or authenticated client request.

`src/lib/github-projects.ts` reads the public profile with `node-html-parser` and extracts the pinned section in its displayed order. It ignores automatically selected popular repositories and pinned gists. Each repository's public About metadata supplies its homepage URL when available.

Direct page parsing avoids the uptime, rate limits, and response formats of a separate community API. Both approaches depend on GitHub's public markup, so removing the intermediary reduces the number of services involved. The tradeoff is that markup changes may require parser maintenance; unreadable or unavailable pages produce a safe fallback.

## Mapping

| `Project` field                   | Value                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| `id`                              | Lowercase `github:OWNER/REPO`                                             |
| `slug`                            | Lowercase `github-OWNER__REPO`, with validated owner and repository names |
| `title`                           | Repository name                                                           |
| `shortDescription`, `description` | Normalized description, or a neutral fallback                             |
| `techStack`                       | Primary language as a one-item array, or an empty array                   |
| `thumbnailUrl`                    | `null`, retaining the typographic cover                                   |
| `projectUrl`                      | Valid HTTP(S) homepage, falling back to the repository URL                |
| `repoUrl`                         | Public repository URL                                                     |
| `signOrder`                       | Zero-based position in the collection                                     |
| `isSample`                        | `false` for GitHub repositories; `true` for local concepts                |

The collection contains up to six pins in GitHub order. If fewer than six are available, local sample projects fill the remaining places without duplicate slugs. The collection's `sample` flag is true whenever placeholders are present, while individual markers prevent real repositories from receiving the concept-project notice.

## Cache and fallback

The project uses the App Router with Cache Components disabled. `unstable_cache` stores each completed collection for 3,600 seconds, keyed by username, and React `cache` deduplicates access within a render. Raw HTML requests use `no-store` inside that cached function.

The homepage uses hourly incremental static regeneration. Project detail paths render on demand using the same data cache. Revalidation is request-driven after expiry, not a scheduled background job; development mode can refresh more frequently.

A shared eight-second deadline bounds the profile request and concurrent repository metadata requests. Missing or invalid configuration, a failed request, an unreadable profile, or zero pins returns six sample projects. Fallback collections are cached as well. A failed optional homepage lookup keeps the real repository and its GitHub URL. Cache-service failures also produce a usable collection.

## README briefs

`src/lib/github-readme.ts` extracts the rendered README from a public repository page after validating its URL. README results, including missing results, have a separate one-hour cache per repository and an eight-second request deadline. They are loaded only for project pages, not included in the homepage's project payload.

`ProjectReadme` rebuilds permitted document elements as React nodes. It discards scripts, event handlers, remote styles, and unsafe URLs. Relative links and images resolve against GitHub; section anchors stay within the brief. Tables, lists, code blocks, and images retain their document structure. If a README cannot be loaded, the description and repository link remain available.

## Relevant tests

- `tests/github-projects.test.ts`: pin order, metadata, unique slugs, sample padding, invalid configuration, deadlines, and source failures.
- `tests/github-readme.test.ts`: README extraction, permitted document elements, code and tables, relative links, unsafe HTML, and missing-source behavior.
- `tests/signpost-fit.test.ts`: board boundaries across viewport sizes, project counts, rotation, and scrolling.
