# Photos

The Work page shows photos from the Instagram account named in `src/data/profile.ts` (`photography`), three to a page. There are two sources:

1. **Instagram** (automatic): when `INSTAGRAM_ACCESS_TOKEN` is set, the server reads the account's latest 12 posts once an hour. Albums show their cover, videos their thumbnail, and each photo links to its post.
2. **Files in the repository** (fallback): when no token is set, or Instagram cannot be reached, the photos listed in `src/data/photos.ts` are shown. With neither, the photo scene is left out.

## Connect Instagram

Instagram only gives API access to **professional accounts** (Creator or Business; switching is free in the Instagram app under Settings > Account type and tools).

1. At [developers.facebook.com](https://developers.facebook.com), create an app and add the **Instagram** product ("API setup with Instagram login").
2. Add your Instagram account under "Generate access tokens" and generate a token. It only needs the `instagram_business_basic` permission.
3. In Vercel, add `INSTAGRAM_ACCESS_TOKEN` (Production only, type Secret) and redeploy. Never paste the token anywhere else.

A token lasts 60 days. The site keeps the one in use in Upstash Redis (`portfolio:instagram:token`) and swaps it for a fresh one once it is 30 days old, so it keeps working as long as the site is visited now and then. If it ever expires (the photo scene falls back to the files), generate a new token and replace the variable in Vercel; the new one takes over on the next deploy.

Visitors' browsers load these photos from Instagram's image servers, without a referrer. To keep every request on your own site, use the files instead.

## Use files instead

```sh
node scripts/add-photos.mjs ~/Pictures/one.jpg ~/Pictures/two.jpg
```

The script crops each photo to 4:5, resizes it to 1080x1350, removes all metadata (including GPS) and saves it in `public/photos/`. It then adds an entry to `src/data/photos.ts`; open that file to write the `alt` text and, optionally, the Instagram post to link to (`href`). Never copy an original camera file into `public/` by hand.

## How it works

`src/lib/instagram.ts` holds the request, the checks on Instagram's answer (only `https:` image addresses, only `instagram.com` post links) and the token rules; `src/lib/photos.ts` caches the result for an hour; `src/components/PhotoScene.tsx` shows it. The token is sent only from the server and never appears in an error message.
