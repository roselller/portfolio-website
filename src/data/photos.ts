import type { Photo } from "@/lib/instagram";

// Photos shown on the Work page when Instagram is not connected (or cannot be
// reached). Add entries with `node scripts/add-photos.mjs <photo>...`, which
// resizes the files into public/photos/ and strips their location data. Never
// put an original camera file in public/: phone photos carry GPS.
// `href` is the Instagram post the photo links to (or null).
export const localPhotos: Photo[] = [];
