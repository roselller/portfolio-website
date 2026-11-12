// Pure maths for the photo scene (no DOM, so it can be tested).

/** Photos shown side by side on one page: three, or one on phones. */
export const PHOTOS_PER_PAGE = 3;
export const PHOTOS_PER_PAGE_PHONE = 1;

/** Splits a list into pages of `size`; the last page may be shorter. */
export function toPages<T>(items: readonly T[], size: number): T[][] {
  const step = Math.max(1, Math.floor(size));
  const pages: T[][] = [];
  for (let start = 0; start < items.length; start += step) {
    pages.push(items.slice(start, start + step));
  }
  return pages;
}

/**
 * The page to show after the page size changed (a phone turned sideways), so
 * the first photo that was on screen stays on screen.
 */
export function pageForItem(itemIndex: number, size: number, count: number) {
  const step = Math.max(1, Math.floor(size));
  const last = Math.max(0, Math.ceil(count / step) - 1);
  return Math.max(0, Math.min(last, Math.floor(itemIndex / step)));
}
