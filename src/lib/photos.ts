import { localPosts } from "@/data/photos";
import { sortPosts } from "@/lib/photo-posts";

/** The photo posts kept in the repository, latest (highest number) first. */
export function getLocalPosts() {
  return sortPosts(localPosts);
}
