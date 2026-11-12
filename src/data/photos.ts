// The photo posts on the Work page, each with its own page at /photos/<id>.
// Add one with `node scripts/add-photos.mjs "<folder>"`, which turns the
// folder's originals into small, upright, location-free files in
// public/photography/<id>/ (cover.webp, then 1.webp, 2.webp, ...). Never put
// an original camera file in public/: originals carry GPS.
export type PhotoPost = {
  /** The post's number: the highest is the latest and is shown first. */
  id: string;
  /** The folder's name, shown as the post page's title. */
  title: string;
  /** What the cover shows, for people who cannot see it. */
  alt: string;
  /** How many numbered photos follow the cover. */
  photos: number;
};

export const localPosts: PhotoPost[] = [];
