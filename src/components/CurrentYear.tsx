"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Pages are built ahead of time; the browser swaps in the visitor's current year. */
export function CurrentYear({ buildYear }: { buildYear: number }) {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => buildYear,
  );
  return <>{year}</>;
}
