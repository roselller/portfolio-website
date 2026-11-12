# Photos

The Work page shows the photo posts listed in `src/data/photos.ts`. Their files live in the repository (`public/photography/`), so no outside service is involved. With no posts, the photo section is left out.

## Add a post

Keep each post's originals in a folder named `[number] date`, for example `[17] 18.05.26` (a higher number is a later post), with the first photo as `cover.jpeg` and the rest as `1.png`, `2.png`, and so on. Then:

```sh
node scripts/add-photos.mjs "/path/to/[17] 18.05.26"
```

The script turns every photo upright (a landscape photo is turned 90 degrees clockwise, so the whole post is portrait), crops it to 3:4, resizes it to 1080x1440 and saves it as WebP without metadata (no GPS) in `public/photography/<number>/`. It then adds the post to `src/data/photos.ts`; open that file to write the cover's `alt` text. Never copy an original camera file into `public/` by hand.

On the Work page the posts appear as folders in a file-browser window, in number order. Under the pointer a folder's first three photos (the cover and photos 1 and 2) pop out of it, and a click opens the post's own page (`/photos/<number>`), which shows the folder name as its title and every photo in one column.

## How it works

`src/lib/photo-posts.ts` turns the posts into file addresses and folders; `src/components/PhotoScene.tsx` draws the window and `src/app/photos/[id]/page.tsx` a post's page.

Reading the posts straight from Instagram was tried and dropped: new Meta apps must use "Unified login", which needs a Meta business portfolio.
