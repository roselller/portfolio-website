"use client";

import { useSyncExternalStore } from "react";
import { formatRetrievedAt } from "@/lib/retrieved-at";

const noSubscription = () => () => {};

/**
 * The page is prerendered, so the server cannot know the visitor's time zone.
 * The server and hydration render nothing; the time then appears in the
 * visitor's own zone, with no mismatch and no wrong value shown first.
 */
export function RetrievedAt({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noSubscription,
    () => formatRetrievedAt(iso),
    () => null,
  );
  if (!text) return null;
  return (
    <time className="project-visual-retrieved" dateTime={iso}>
      Last synced {text}
    </time>
  );
}
