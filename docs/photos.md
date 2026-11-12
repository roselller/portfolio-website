# Photos

The Work page shows the photo posts listed in `src/data/photos.ts`. Their files live in the repository (`public/photography/`), so no outside service is involved. With no posts, the photo section is left out.

## Add a post

Keep each post's originals in a folder named `[number] date`, for example `[17] 18.05.26` (a higher number is a later post), with the first photo as `cover.jpeg` and the rest as `1.png`, `2.png`, and so on. Add a `content.md` beside them:

```
TITLE:A trip to the old town
HASHTAGS:#travel,#taiwan
LOCATION:Old town
```

Then:

```sh
node scripts/add-photos.mjs "/path/to/[17] 18.05.26"
```

The script turns every photo upright, crops it to 3:4 (or 4:3 for a horizontal photo, which stays horizontal), resizes it to 1080x1440 and saves it as WebP without metadata (no GPS) in `public/photography/<number>/`. It then adds the post to `src/data/photos.ts` with the title, hashtags and location from `content.md`; open that file to write the cover's `alt` text. Never copy an original camera file into `public/` by hand. If the post is already listed, the script prints the entry so you can update it by hand.

On the Work page the posts appear as folders in a file-browser window, five to a row, in number order, labelled with the folder name. Under the pointer a folder's first three photos pop out of it: the cover in the middle, photo 1 on the left, photo 2 on the right. A click opens the post's own page (`/photos/<number>`): the title card, the location and hashtags, then every photo in columns as wide as the header.

## How it works

`src/lib/photo-posts.ts` turns the posts into file addresses and folders; `src/components/PhotoScene.tsx` draws the window and `src/app/photos/[id]/page.tsx` a post's page.

Reading the posts straight from Instagram was tried and dropped: new Meta apps must use "Unified login", which needs a Meta business portfolio.
