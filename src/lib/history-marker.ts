// Tells a page whether it was just reached with the browser's Back or Forward
// button (or a reload), in which case the browser or Next restores the scroll
// position and nothing should move it. Imported by the layout's provider so
// the listener exists before any client navigation happens.
let lastHistoryMove = Number.NEGATIVE_INFINITY;
let documentChecked = false;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastHistoryMove = performance.now();
  });
}

/** True when the page being shown now came from Back, Forward or a reload. */
export function arrivedByHistory() {
  if (performance.now() - lastHistoryMove < 1500) return true;
  // The browser's own record covers the first page of the document only.
  if (documentChecked) return false;
  documentChecked = true;
  const entry = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return entry?.type === "back_forward" || entry?.type === "reload";
}
