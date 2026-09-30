import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  loadGitHubReadme,
  parseRepositoryReadme,
} from "../src/lib/github-readme";
import { ProjectReadme } from "../src/components/ProjectReadme";

const repositoryUrl = "https://github.com/owner/project";
const readme = "<h1>Project &amp; purpose</h1><p>Read the full brief.</p>";
const page = `<nav>Repository navigation</nav><article class="markdown-body entry-content">${readme}</article><footer>Other page content</footer>`;
const render = (html: string) =>
  renderToStaticMarkup(ProjectReadme({ html, repositoryUrl }));

test("README extraction includes the rendered document without GitHub page chrome", async () => {
  assert.equal(parseRepositoryReadme(page), readme);
  assert.equal(
    parseRepositoryReadme("<main>No README in this repository</main>"),
    null,
  );
  assert.equal(
    parseRepositoryReadme('<article class="markdown-body"> </article>'),
    null,
  );
  const result = await loadGitHubReadme(repositoryUrl, async (url, init) => {
    assert.equal(url, repositoryUrl);
    assert.equal(new Headers(init?.headers).has("Authorization"), false);
    assert.equal(new Headers(init?.headers).has("Cookie"), false);
    assert.ok(init?.signal);
    return new Response(page, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });
  assert.equal(result, readme);
});

test("missing README, request errors, and invalid repository URLs leave a usable fallback", async () => {
  let calls = 0;
  for (const invalid of [
    "https://example.com/owner/repo",
    "http://github.com/owner/repo",
    "https://github.com/owner/repo?tab=readme",
    "https://github.com/owner/repo/extra",
    "https://user:password@github.com/owner/repo",
  ]) {
    assert.equal(
      await loadGitHubReadme(invalid, async () => {
        calls++;
        return new Response(page);
      }),
      null,
    );
  }
  assert.equal(calls, 0);
  for (const fetchPage of [
    async () => {
      throw new Error("Offline");
    },
    async () => new Response("Unavailable", { status: 503 }),
    async () =>
      new Response("{}", { headers: { "Content-Type": "application/json" } }),
    async () =>
      new Response("<p>No readme</p>", {
        headers: { "Content-Type": "text/html" },
      }),
  ])
    assert.equal(await loadGitHubReadme(repositoryUrl, fetchPage), null);
});

test("a stalled README request is bounded by the deadline", async () => {
  let aborted = false;
  const result = await loadGitHubReadme(
    repositoryUrl,
    async (_, init) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(new Response(page)), 1000);
        init?.signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            aborted = true;
            reject(init.signal?.reason);
          },
          { once: true },
        );
      }),
    10,
  );
  assert.equal(aborted, true);
  assert.equal(result, null);
});

test("README rendering preserves headings, tables, code, task lists, and local section links", () => {
  const output = render(`${readme}
    <div class="markdown-heading"><h2>Play</h2><a class="anchor" id="user-content-play" href="#play"><svg></svg></a></div>
    <p><a href="#play">Jump to Play</a></p>
    <markdown-accessiblity-table><table>
      <thead>
        <tr>
          <th>Key</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Space</td><td>Start</td>
        </tr>
      </tbody>
    </table></markdown-accessiblity-table>
    <pre><code>&lt;safe&gt; &amp; text</code></pre>
    <ul><li><input type="checkbox" checked>Ready</li></ul>
    <details><summary>More</summary><p>Details</p></details>`);
  assert.ok(output.includes("<h3>Project &amp; purpose</h3>"));
  assert.ok(output.includes('id="readme-play"'));
  assert.ok(output.includes('href="#readme-play"'));
  assert.ok(output.includes("<h4>Play</h4>"));
  assert.ok(output.includes("<th>Action</th>"));
  assert.ok(output.includes("<td>Start</td>"));
  assert.doesNotMatch(output, /<(?:table|thead|tbody|tfoot|tr)>\s+/);
  assert.doesNotMatch(output, /\s+<\/(?:table|thead|tbody|tfoot|tr)>/);
  assert.ok(output.includes("<code>&lt;safe&gt; &amp; text</code>"));
  assert.ok(
    output.includes('type="checkbox" disabled="" readOnly="" checked=""'),
  );
  assert.ok(output.includes("<summary>More</summary>"));
});

test("README links and images resolve against GitHub instead of the portfolio origin", () => {
  const output = render(
    '<a href="src/game.py">Code</a><a href="/owner/project/issues">Issues</a><img src="assets/demo.png" alt="A demo">',
  );
  assert.ok(
    output.includes(
      'href="https://github.com/owner/project/blob/HEAD/src/game.py"',
    ),
  );
  assert.ok(output.includes('href="https://github.com/owner/project/issues"'));
  assert.ok(
    output.includes(
      'src="https://github.com/owner/project/raw/HEAD/assets/demo.png"',
    ),
  );
  assert.ok(output.includes('alt="A demo"'));
  assert.ok(output.includes('rel="noopener noreferrer"'));
});

test("remote HTML cannot inject scripts, event handlers, styles, frames, or unsafe URLs", () => {
  const output =
    render(`<p id="main" style="position:fixed" onclick="evil()">Safe text</p>
    <script>evil()</script><style>body{display:none}</style><iframe src="https://example.com"></iframe>
    <a href="javascript:evil()">Unsafe link</a><a href="java&#x73;cript:evil()">Encoded link</a>
    <img src="data:image/svg+xml,unsafe" onerror="evil()"><img src="https://example.com/safe.png" onload="evil()">
    <form action="https://example.com"><input value="secret"></form>`);
  assert.ok(output.includes('id="readme-main"'));
  assert.ok(output.includes("Safe text"));
  assert.ok(output.includes("Unsafe link"));
  assert.ok(output.includes('src="https://example.com/safe.png"'));
  for (const forbidden of [
    "<script",
    "<style",
    "<iframe",
    "onclick=",
    "onerror=",
    "onload=",
    "style=",
    "javascript:",
    "data:image",
    "evil()",
    "<form",
    "secret",
  ]) {
    assert.ok(!output.includes(forbidden), `must omit ${forbidden}`);
  }
});
