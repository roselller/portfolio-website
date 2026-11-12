# Writing

The Work page lists each piece of writing as a document on the writing tab of its file-browser window, newest first. Every piece also gets its own page at `/writing/<file-name>`.

## Add a piece

1. Create a file in `content/writing/`, for example `content/writing/why-hawker-centres-matter.md`. The file name becomes the page address, so use lowercase letters, numbers and single hyphens only.
2. Start it with a short header between two `---` lines, then write the text below it in [Markdown](https://commonmark.org/help/):

   ```md
   ---
   title: Why hawker centres matter
   date: 2026-09-14
   type: Opinion
   summary: One line shown in search results and link previews.
   ---

   The first paragraph.

   ## A heading

   More text, with _italics_, **bold**, lists and [links](https://example.com).
   ```

3. Commit and push (or use **Add file** on github.com). Every push to `main` goes live.

| Field     | Required | Notes                                                                                       |
| --------- | -------- | ------------------------------------------------------------------------------------------- |
| `title`   | Yes      | Shown under the document and as the page title. A file without a title is skipped           |
| `date`    | No       | `YYYY-MM-DD`. Sets the order (newest in front); pieces without a date go to the back        |
| `type`    | No       | A short label such as `Opinion` or `Proposal`. Defaults to `Writing`                        |
| `summary` | No       | One or two sentences, used for search results and link previews                             |
| `pdf`     | No       | A file name in `public/writing/`, for example `proposal.pdf`. Adds an "Open the PDF" button |

## PDFs and images

- To offer the original document, put the PDF in `public/writing/` and name it in the `pdf` field. A piece can be a PDF with only a summary (leave the text empty), but text on the page reads better on phones.
- Before publishing a PDF, check its document properties: exported files often carry the author's full name and the software used.
- Images go in `public/writing/` too and are written as `![What the image shows](/writing/figure-1.png)`. Never publish an original phone photo: it carries GPS data.

## How it is rendered

`src/lib/writing-file.ts` reads the header, `src/lib/writing.ts` loads the folder and turns Markdown into HTML with `marked`. That HTML is never inserted as it is: `SafeHtml` (in `src/components/ProjectReadme.tsx`) rebuilds it from an allowlist of plain document elements, so scripts, event handlers, forms and `javascript:` links in a file are dropped. Links may point to `https:`, `http:`, `mailto:` and files under `/writing/`.

The home page and the sitemap are rebuilt on the server every hour, so `next.config.ts` lists `content/writing/` in `outputFileTracingIncludes`. Keep that entry if the folder moves.
