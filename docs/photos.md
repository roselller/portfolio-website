# Photos

The Work page shows photos from the Instagram account named in `src/data/profile.ts` (`photography`), three to a page. There are two sources:

1. **Instagram** (automatic): when `INSTAGRAM_ACCESS_TOKEN` is set, the server reads the account's latest 12 posts once an hour. Albums show their cover, videos their thumbnail, and each photo links to its post.
2. **Files in the repository** (fallback): when no token is set, or Instagram cannot be reached, the photos listed in `src/data/photos.ts` are shown. With neither, the photo scene is left out.

## Connect Instagram

Instagram only gives API access to **professional accounts** (Creator or Business; switching is free in the Instagram app). New Meta apps use **API setup with Unified login**, which issues a system-user token that does not expire.

1. At [developers.facebook.com](https://developers.facebook.com), create an app with the use case "Manage messaging & content on Instagram", linked to your business portfolio.
2. Under Instagram > API setup with Unified login, connect your Instagram account and generate a token.
3. Put the token in `INSTAGRAM_ACCESS_TOKEN` (`.env.local` to try it, then Vercel: Production only, type Secret) and redeploy. Never paste the token anywhere else.
4. If the photos do not appear although the token is valid, Meta may list no account for it: set `INSTAGRAM_ACCOUNT_ID` to the account's numeric Instagram ID as well.

If the token is ever revoked, the photo scene falls back to the files; generate a new token and replace the variable.

Visitors' browsers load these photos from Instagram's image servers, without a referrer. To keep every request on your own site, use the files instead.

## Use files instead

```sh
node scripts/add-photos.mjs ~/Pictures/one.jpg ~/Pictures/two.jpg
```

The script crops each photo to 4:5, resizes it to 1080x1350, removes all metadata (including GPS) and saves it in `public/photos/`. It then adds an entry to `src/data/photos.ts`; open that file to write the `alt` text and, optionally, the Instagram post to link to (`href`). Never copy an original camera file into `public/` by hand.

## How it works

`src/lib/instagram.ts` holds the requests (to `graph.facebook.com`) and the checks on Instagram's answer (only `https:` image addresses, only `instagram.com` post links); `src/lib/photos.ts` caches the result for an hour; `src/components/PhotoScene.tsx` shows it. The token is sent only from the server, in a header, and never appears in a URL or an error message.
