import type { Photo } from "@/lib/instagram";

// Posts shown on the Work page when Instagram is not connected (or cannot be
// reached). Add one with `node scripts/add-photos.mjs "<folder>"`, which
// resizes the folder's cover and first photos into public/photos/<id>/ and
// strips their location data. Never put an original camera file in public/:
// originals carry GPS. `id` is the post's number (the highest is shown first),
// `fan` the photos that spread out behind the cover under the pointer, and
// `href` the Instagram post it links to (or null).
export const localPhotos: Photo[] = [];
