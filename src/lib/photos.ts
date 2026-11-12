import "server-only";
import { cache } from "react";
import { getContent } from "@/lib/content";

/** The photo posts, latest (highest number) first. Never throws. */
export const getPosts = cache(async () => (await getContent()).posts);
