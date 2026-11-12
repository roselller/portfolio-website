# Photos

The photo posts on the Work page come from your **private content repository**, not from this website's repository. Add or change a post, push the content repository, and the site shows it within an hour. Nothing is committed here. With no posts, the photo tab is left out.

The repository layout:

```
photography/17/post.json          the post's details (written by the script)
photography/17/cover.webp         the cover, then 1.webp, 2.webp, ...
photography/17/cover-s.webp       a half-size copy of every photo (1-s.webp, ...)
writing/<slug>.md                 see writing.md
```

Setup (token, Vercel variables) is in [configuration](configuration.md) and [deployment](deployment.md).

## Add a post

Keep each post's originals in a folder named `[number] date`, for example `[17] 18.05.26` (a higher number is a later post), with the first photo as `cover.jpeg` and the rest as `1.png`, `2.png`, and so on. Add a `content.md` beside them:

```
TITLE:A trip to the old town
HASHTAGS:#travel,#taiwan
LOCATION:Old town
LINK:https://www.instagram.com/p/.../
ALT:What the cover shows, for people who cannot see it.
```

`ALT` is required; the script refuses a post without it. Then, with `CONTENT_DIR` in `.env.local` pointing at your clone of the content repository:

```sh
pnpm photos:add "$HOME/Documents/bnhisu_photography/[17] 18.05.26"
pnpm content:check
```

The script turns every photo upright, crops it to 3:4 (or 4:3 for a horizontal photo, which stays horizontal), resizes it to 1080x1440 and saves it as WebP, with a half-size copy beside it. The cover is always 3:4. Originals can be JPEG, PNG or WebP (not HEIC). No metadata is written, and each output is read back: if it still carries EXIF, XMP or IPTC (where GPS lives), nothing is added. Nothing is written unless every photo passed. It then prints the `git` lines to commit and push the content repository. Running it again for the same number replaces that post.

`pnpm content:check` reads the whole content folder with the website's own loader and lists what the site would show. In development (`pnpm dev`), `CONTENT_DIR` makes the site read that folder directly, so you can preview before you push. It is ignored in production.

## How it works

`src/lib/content.ts` reads the content once an hour (cached, like the GitHub projects). If the store cannot be reached, the Work page simply renders without the window. `src/lib/content-source.ts` is the reader (GitHub with a read-only token, or the folder), `content-manifest.ts` picks the files it knows (any other path is ignored), and `photo-post-file.ts` checks each `post.json` (text lengths, the photo count against the files, only an `instagram.com` link).

Photos are served from this site's own address, `/photography/<number>/<name>.webp?v=<id>`, by `src/app/photography/[id]/[file]/route.ts`. It serves only files that a loaded post lists, so the repository stays private and the browser never talks to GitHub. The `v` value is the start of the file's git id, so a replaced photo gets a new address and the long cache never shows the old one.

`src/lib/photo-posts.ts` turns the posts into file addresses and folders; `src/components/WorkExplorer.tsx` draws the window and `src/app/photos/[id]/page.tsx` a post's page.

Reading the posts straight from Instagram was tried and dropped: new Meta apps must use "Unified login", which needs a Meta business portfolio.
