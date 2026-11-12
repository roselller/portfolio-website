# Photos

The Work page shows photos from the Instagram account named in `src/data/profile.ts` (`photography`), three to a page. There are two sources:

1. **Instagram** (automatic): when `INSTAGRAM_ACCESS_TOKEN` is set, the server reads the account's latest 12 posts once an hour. Albums show their cover, videos their thumbnail, and each photo links to its post.
2. **Files in the repository** (what the site uses now): when no token is set, or Instagram cannot be reached, the posts listed in `src/data/photos.ts` are shown. With neither, the photo scene is left out.

## Connect Instagram

Instagram only gives API access to **professional accounts** (Creator or Business; switching is free in the Instagram app). New Meta apps use **API setup with Unified login**, which issues a system-user token that does not expire.

1. At [developers.facebook.com](https://developers.facebook.com), create an app with the use case "Manage messaging & content on Instagram", linked to your business portfolio.
2. Under Instagram > API setup with Unified login, connect your Instagram account and generate a token.
3. Put the token in `INSTAGRAM_ACCESS_TOKEN` (`.env.local` to try it, then Vercel: Production only, type Secret) and redeploy. Never paste the token anywhere else.
4. If the photos do not appear although the token is valid, Meta may list no account for it: set `INSTAGRAM_ACCOUNT_ID` to the account's numeric Instagram ID as well.

If the token is ever revoked, the photo scene falls back to the files; generate a new token and replace the variable.

Visitors' browsers load these photos from Instagram's image servers, without a referrer. To keep every request on your own site, use the files instead.

## Use files instead

Keep each post's originals in a folder named `[number] date`, for example `[17] 18.05.26` (a higher number is a later post), with the first photo as `cover.jpeg` and the rest as `1.png`, `2.png`, and so on. Then:

```sh
node scripts/add-photos.mjs "/path/to/[17] 18.05.26"
```

The script turns every photo upright (a landscape photo is turned 90 degrees clockwise, so the whole post is portrait), crops it to 3:4, resizes it to 1080x1440 and saves it as WebP without metadata (no GPS) in `public/photography/<number>/`. It then adds the post to `src/data/photos.ts`; open that file to write the cover's `alt` text. Never copy an original camera file into `public/` by hand.

On the Work page the posts sit on a loop: the latest in the middle, the one before it on the right, the oldest on the left. A click on a side post turns the loop. Under the pointer the middle post fans its first two photos out behind the cover, and a click opens the post's own page (`/photos/<number>`), which shows the folder name as its title and every photo in one column.

## How it works

`src/lib/instagram.ts` holds the requests (to `graph.facebook.com`) and the checks on Instagram's answer (only `https:` image addresses, only `instagram.com` post links); `src/lib/photos.ts` caches the result for an hour; `src/lib/photo-posts.ts` turns the posts in the repository into file addresses; `src/components/PhotoScene.tsx` shows the loop and `src/app/photos/[id]/page.tsx` a post's page. The token is sent only from the server, in a header, and never appears in a URL or an error message.
