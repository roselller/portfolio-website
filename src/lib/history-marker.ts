// Tells a page whether it was just reached with the browser's Back or Forward
// button (or a reload), in which case the browser or Next restores the scroll
// position and nothing should move it. Imported by the layout's provider so
// the listener exists before any client navigation happens.
let lastHistoryMove = Number.NEGATIVE_INFINITY;
let loadedByHistory = false;
let loadedPath = "";

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastHistoryMove = performance.now();
  });
  // The browser's own record covers the page the document was loaded on.
  const entry = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  loadedByHistory = entry?.type === "back_forward" || entry?.type === "reload";
  loadedPath = window.location.pathname;
}

/**
 * True when the page being shown now came from Back, Forward or a reload.
 * Asking twice gives the same answer (React Strict Mode mounts twice).
 */
export function arrivedByHistory() {
  if (performance.now() - lastHistoryMove < 1500) return true;
  return loadedByHistory && window.location.pathname === loadedPath;
}
