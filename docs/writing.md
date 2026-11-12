# Writing

The Work page lists each piece of writing as a document on the writing tab of its file-browser window, newest first. Every piece also gets its own page at `/writing/<file-name>`.

## Add a piece

1. In your **private content repository** (not this website's), create `writing/why-hawker-centres-matter.md`, for example. The file name becomes the page address, so use lowercase letters, numbers and single hyphens only.
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

3. Run `pnpm content:check` here (with `CONTENT_DIR` set), then commit and push the content repository (or use **Add file** on github.com). The site picks it up within an hour; nothing is committed to the website.

| Field     | Required | Notes                                                                                |
| --------- | -------- | ------------------------------------------------------------------------------------ |
| `title`   | Yes      | Shown under the document and as the page title. A file without a title is skipped    |
| `date`    | No       | `YYYY-MM-DD`. Sets the order (newest in front); pieces without a date go to the back |
| `type`    | No       | A short label such as `Opinion` or `Proposal`. Defaults to `Writing`                 |
| `author`  | No       | The byline. Defaults to the site owner's name (`src/data/profile.ts`)                |
| `summary` | No       | One or two sentences, used for search results and link previews                      |

## Images and PDFs

The content repository holds text only: pieces cannot offer a PDF or include images from files. An image can be linked from another `https:` address with `![What the image shows](https://...)`. Never publish an original phone photo: it carries GPS data.

## How it is rendered

`src/lib/writing-file.ts` reads the header, `src/lib/writing.ts` takes the pieces from the content store (`src/lib/content.ts`, cached for an hour) and turns Markdown into HTML with `marked`. That HTML is never inserted as it is: `SafeHtml` (in `src/components/ProjectReadme.tsx`) rebuilds it from an allowlist of plain document elements, so scripts, event handlers, forms and `javascript:` links in a file are dropped. Links may point to `https:`, `http:`, `mailto:` and pages of this site.
