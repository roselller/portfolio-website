// The photo posts on the Work page, each with its own page at /photos/<id>.
// Add one with `node scripts/add-photos.mjs "<folder>"`, which turns the
// folder's originals into small, upright, location-free files in
// public/photography/<id>/ (cover.webp, then 1.webp, 2.webp, ...) and reads
// its content.md. Never put an original camera file in public/: originals
// carry GPS.
export type PhotoPost = {
  /** The post's number: the highest is the latest. */
  id: string;
  /** The folder's name on disk, shown under the folder on the Work page. */
  folder: string;
  /** The post's title (content.md TITLE), shown on its page. */
  title: string;
  /** content.md HASHTAGS, without the #. */
  hashtags: string[];
  /** content.md LOCATION, or "". */
  location: string;
  /** content.md LINK: the post on Instagram, or "". */
  link: string;
  /** What the cover shows, for people who cannot see it. */
  alt: string;
  /** How many numbered photos follow the cover. */
  photos: number;
  /** The numbered photos that are landscape (4:3); the rest are 3:4. */
  landscape: number[];
};

export const localPosts: PhotoPost[] = [];
