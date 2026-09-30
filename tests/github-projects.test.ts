import assert from "node:assert/strict";
import test from "node:test";
import {
  loadGitHubProjects,
  parsePinnedRepositories,
  parseRepositoryHomepage,
} from "../src/lib/github-projects";
import { sampleProjects } from "../src/data/projects";

// Structure verified against GitHub's public profile markup on 25 September 2026.
function card(owner: string, name: string, details = true) {
  return `<li class="pinned-item-list-item js-pinned-item-list-item">
    <div class="Box public source"><div class="pinned-item-list-item-content">
      <span><a href="/${owner}/${name}"><span class="repo">${name}</span></a></span>
      ${details ? '<p class="pinned-item-desc">Tools &amp; ideas\n for everyone.</p><span itemprop="programmingLanguage">TypeScript</span>' : ""}
      <a class="pinned-item-meta" href="/${owner}/${name}/stargazers">1</a>
    </div></div>
  </li>`;
}

function profile(cards: string, heading = "Pinned") {
  return `<html><body>
    <a href="/unrelated/readme-link">Not a pin</a>
    <div class="js-pinned-items-reorder-container">
      <h2>${heading}<span class="sr-only"> Loading</span></h2>
      <ol class="js-pinned-items-reorder-list">${cards}</ol>
    </div>
  </body></html>`;
}

function homepage(website: string | null) {
  return `<react-app app-name="code-view"><script type="application/json" data-target="react-app.embeddedData">${JSON.stringify({ payload: { sidebarAbout: { website } } })}</script></react-app>`;
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

test("public profile parsing preserves pin order, decodes text, and ignores other links and gists", () => {
  const pins = parsePinnedRepositories(
    profile(
      card("someone-else", "hello.world") +
        '<li class="js-pinned-item-list-item"><a href="https://gist.github.com/owner/abc123">Gist</a></li>' +
        card("owner", "second", false),
    ),
  );
  assert.deepEqual(pins, [
    {
      owner: "someone-else",
      name: "hello.world",
      description: "Tools & ideas for everyone.",
      language: "TypeScript",
    },
    {
      owner: "owner",
      name: "second",
      description: "A public GitHub repository.",
      language: "",
    },
  ]);
  assert.deepEqual(
    parsePinnedRepositories(
      profile(card("owner", "popular"), "Popular repositories"),
    ),
    [],
  );
  assert.throws(() => parsePinnedRepositories("<h1>Something went wrong</h1>"));
});

test("repository homepages come from the About metadata, not README links", () => {
  assert.equal(
    parseRepositoryHomepage(homepage("https://example.com/app")),
    "https://example.com/app",
  );
  assert.equal(
    parseRepositoryHomepage(
      '<div class="BorderGrid"><div><svg class="octicon-link"></svg><a href="https://example.com/legacy">Website</a></div></div>',
    ),
    "https://example.com/legacy",
  );
  assert.equal(
    parseRepositoryHomepage(
      '<article><a href="https://example.com/readme">README link</a></article>',
    ),
    null,
  );
  assert.equal(parseRepositoryHomepage(homepage("javascript:alert(1)")), null);
  assert.equal(parseRepositoryHomepage(homepage(null)), null);
  assert.equal(
    parseRepositoryHomepage(
      '<react-app app-name="code-view"><script data-target="react-app.embeddedData">invalid JSON</script></react-app>',
    ),
    null,
  );
});

test("zero, one, three, and six pins produce six correctly marked projects with no padding beyond six", async () => {
  for (const count of [0, 1, 3, 6]) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchPage: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return html(
        String(url) === "https://github.com/owner"
          ? profile(
              Array.from({ length: count }, (_, index) =>
                card("owner", `repo-${index}`),
              ).join(""),
            )
          : homepage("https://example.com/app"),
      );
    };
    const collection = await loadGitHubProjects("owner", fetchPage);
    assert.equal(collection.projects.length, 6);
    assert.equal(collection.sample, count < 6);
    assert.equal(
      collection.projects.filter((project) => !project.isSample).length,
      count,
    );
    assert.deepEqual(
      collection.projects.map((project) => project.signOrder),
      [0, 1, 2, 3, 4, 5],
    );
    assert.deepEqual(
      collection.projects.slice(count).map((project) => project.slug),
      sampleProjects.slice(0, 6 - count).map((project) => project.slug),
    );
    if (count) {
      assert.deepEqual(collection.projects[0], {
        id: "github:owner/repo-0",
        slug: "github-owner__repo-0",
        title: "repo-0",
        shortDescription: "Tools & ideas for everyone.",
        description: "Tools & ideas for everyone.",
        techStack: ["TypeScript"],
        thumbnailUrl: null,
        projectUrl: "https://example.com/app",
        repoUrl: "https://github.com/owner/repo-0",
        signOrder: 0,
        isSample: false,
      });
    }
    assert.equal(calls.length, count + 1);
    for (const call of calls) {
      assert.equal(new URL(call.url).hostname, "github.com");
      assert.equal(new Headers(call.init?.headers).has("Authorization"), false);
      assert.equal(new Headers(call.init?.headers).has("Cookie"), false);
      assert.ok(call.init?.signal);
    }
  }
});

test("slugs stay URL-safe, distinct, and stable across owner/name punctuation, duplicates, and reordering", async () => {
  const cards = [
    card("owner", "same.name"),
    card("owner", "same-name"),
    card("owner", "same_name"),
    card("other", "same.name"),
    card("owner", ".github"),
    card("owner", "SAME.NAME"),
  ];
  async function load(items: string[]) {
    return loadGitHubProjects("owner", async (url) =>
      html(
        String(url) === "https://github.com/owner"
          ? profile(items.join(""))
          : homepage(null),
      ),
    );
  }
  const first = (await load(cards)).projects.filter(
    (project) => !project.isSample,
  );
  const reordered = (await load([...cards].reverse())).projects.filter(
    (project) => !project.isSample,
  );
  assert.equal(first.length, 5);
  assert.equal(new Set(first.map((project) => project.slug)).size, 5);
  for (const project of first) {
    assert.match(project.slug, /^[a-z0-9][a-z0-9._-]*$/);
    assert.equal(encodeURIComponent(project.slug), project.slug);
    assert.equal(
      reordered.find((item) => item.id === project.id)?.slug,
      project.slug,
    );
  }
});

test("HTTP errors, network failures, invalid markup, and non-HTML responses use the full sample fallback", async () => {
  const cases: (typeof fetch)[] = [
    async () => {
      throw new Error("Network unavailable");
    },
    async () => html("Rate limited", 429),
    async () => html("Unavailable", 503),
    async () => html("<h1>Temporary error</h1>"),
    async () =>
      new Response("{}", { headers: { "Content-Type": "application/json" } }),
    async () =>
      html(
        profile(
          '<li class="js-pinned-item-list-item"><a href="https://example.com/owner/repo">Wrong host</a></li>',
        ),
      ),
  ];
  for (const fetchPage of cases) {
    const collection = await loadGitHubProjects("owner", fetchPage);
    assert.equal(collection.sample, true);
    assert.ok(collection.projects.every((project) => project.isSample));
    assert.deepEqual(
      collection.projects.map((project) => project.slug),
      sampleProjects.slice(0, 6).map((project) => project.slug),
    );
  }
});

test("the request deadline aborts a stalled fetch and returns samples", async () => {
  let aborted = false;
  const fetchPage: typeof fetch = async (_, init) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => resolve(html(profile(card("owner", "too-late")))),
        1000,
      );
      init?.signal?.addEventListener(
        "abort",
        () => {
          aborted = true;
          clearTimeout(timer);
          reject(init.signal?.reason);
        },
        { once: true },
      );
    });
  const collection = await loadGitHubProjects("owner", fetchPage, 10);
  assert.equal(aborted, true);
  assert.ok(collection.projects.every((project) => project.isSample));
});

test("invalid usernames avoid requests and optional homepage failures preserve actual pins", async () => {
  let calls = 0;
  const fetchPage: typeof fetch = async () => {
    calls++;
    return html(profile(""));
  };
  for (const username of [
    "",
    "../another-path",
    "user?tab=repositories",
    "user/name",
  ]) {
    assert.equal((await loadGitHubProjects(username, fetchPage)).sample, true);
  }
  assert.equal(calls, 0);
  const collection = await loadGitHubProjects("owner", async (url) => {
    if (String(url) === "https://github.com/owner")
      return html(profile(card("owner", "repo", false)));
    throw new Error("Homepage unavailable");
  });
  assert.equal(collection.projects[0].isSample, false);
  assert.equal(
    collection.projects[0].projectUrl,
    "https://github.com/owner/repo",
  );
  assert.deepEqual(collection.projects[0].techStack, []);
});

test("an oversized source response cannot add more than six pins", async () => {
  const collection = await loadGitHubProjects("owner", async (url) =>
    html(
      String(url) === "https://github.com/owner"
        ? profile(
            Array.from({ length: 8 }, (_, index) =>
              card("owner", `repo-${index}`),
            ).join(""),
          )
        : homepage(null),
    ),
  );
  assert.equal(collection.projects.length, 6);
  assert.equal(collection.sample, false);
});
