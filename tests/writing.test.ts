import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { marked } from "marked";
import {
  formatWritingDate,
  parseWritingFile,
  sortWritings,
  splitFrontmatter,
} from "../src/lib/writing-file";
import { SafeHtml, writingUrl } from "../src/components/ProjectReadme";

const file = `---
title: "Why hawker centres matter"
date: 2026-09-14
Type: Opinion
summary: One line: with a colon.
---

First paragraph.

## A heading
`;

test("a writing file gives its header fields and its text", () => {
  const writing = parseWritingFile("hawker-centres", file);
  assert.deepEqual(writing, {
    slug: "hawker-centres",
    title: "Why hawker centres matter",
    date: "2026-09-14",
    type: "Opinion",
    author: "",
    summary: "One line: with a colon.",
    body: "First paragraph.\n\n## A heading",
  });
});

test("Windows line endings and a byte order mark are read the same", () => {
  const writing = parseWritingFile(
    "piece",
    "\uFEFF" + file.replaceAll("\n", "\r\n"),
  );
  assert.equal(writing?.title, "Why hawker centres matter");
  assert.equal(writing?.body, "First paragraph.\n\n## A heading");
});

test("missing or unusable fields fall back instead of failing", () => {
  const writing = parseWritingFile(
    "piece",
    "---\ntitle: Only a title\ndate: 2026-02-31\n---\nText",
  );
  assert.deepEqual(writing, {
    slug: "piece",
    title: "Only a title",
    date: null,
    type: "Writing",
    author: "",
    summary: "",
    body: "Text",
  });
});

test("a file can name its own byline", () => {
  assert.equal(
    parseWritingFile("p", "---\ntitle: T\nauthor: Someone Else\n---\n")?.author,
    "Someone Else",
  );
});

test("a file without a title, or with an unsafe file name, is skipped", () => {
  assert.equal(parseWritingFile("piece", "Just text, no header."), null);
  assert.equal(parseWritingFile("piece", "---\ndate: 2026-01-01\n---\n"), null);
  for (const slug of ["Bad Name", "../up", "a--b", "-a", "a_b", ""]) {
    assert.equal(parseWritingFile(slug, file), null, slug);
  }
});

test("a header that never closes is treated as text", () => {
  const { fields, body } = splitFrontmatter("---\ntitle: Open\nText");
  assert.deepEqual(fields, {});
  assert.equal(body, "---\ntitle: Open\nText");
});

test("writing is listed newest first, undated pieces last", () => {
  const make = (slug: string, date: string | null, title = slug) => ({
    slug,
    title,
    date,
    type: "Writing",
    author: "",
    summary: "",
    body: "",
  });
  const sorted = sortWritings([
    make("old", "2025-01-01"),
    make("none", null),
    make("b", "2026-05-05", "Beta"),
    make("new", "2026-11-12"),
    make("a", "2026-05-05", "Alpha"),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.slug),
    ["new", "a", "b", "old", "none"],
  );
});

test("dates read the same in every time zone", () => {
  assert.equal(formatWritingDate("2026-09-14"), "14 Sep 2026");
  assert.equal(formatWritingDate("2026-01-01"), "1 Jan 2026");
});

test("writing links allow web, mail and /writing/ files only", () => {
  assert.equal(
    writingUrl("https://doi.org/10.1/x", false),
    "https://doi.org/10.1/x",
  );
  assert.equal(writingUrl("mailto:a@b.co", false), "mailto:a@b.co");
  assert.equal(writingUrl("mailto:a@b.co", true), undefined);
  assert.equal(
    writingUrl("/writing/figure-1.png", true),
    "/writing/figure-1.png",
  );
  assert.equal(writingUrl("/writing/../secret", true), undefined);
  assert.equal(writingUrl("/about", false), "/about");
  assert.equal(writingUrl("/about", true), undefined);
  assert.equal(writingUrl("//evil.example/x", false), undefined);
  assert.equal(writingUrl("/\\evil.example", false), undefined);
  assert.equal(writingUrl("javascript:alert(1)", false), undefined);
  assert.equal(writingUrl("data:text/html,x", true), undefined);
  assert.equal(writingUrl("https://user:pw@example.com/", false), undefined);
  assert.equal(writingUrl(undefined, false), undefined);
});

test("Markdown is rendered without scripts, handlers or unsafe links", () => {
  const markdown = [
    "# Top",
    "Text with *emphasis* and <https://example.com/a>.",
    '<script>alert(1)</script><img src="x" onerror="alert(1)">',
    "[bad](javascript:alert(1)) [good](https://example.com/b)",
    '<a href="https://example.com/c" onclick="alert(1)">raw</a>',
  ].join("\n\n");
  const html = renderToStaticMarkup(
    SafeHtml({
      html: marked.parse(markdown, { async: false, gfm: true }),
      className: "writing-body",
      headingShift: 1,
      tableLabel: "Table",
      resolveUrl: writingUrl,
    }),
  );
  assert.match(html, /<h2[^>]*>Top<\/h2>/);
  assert.match(html, /<em>emphasis<\/em>/);
  assert.match(
    html,
    /<a href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer">/,
  );
  assert.match(html, /href="https:\/\/example\.com\/b"/);
  assert.match(html, /href="https:\/\/example\.com\/c"/);
  assert.doesNotMatch(html, /script|alert|onerror|onclick|javascript:|<img/i);
});
