// Pure carousel maths for the project carousel (no DOM, so it can be tested).
// Slides sit on a loop: the one in focus is "active", the two beside it are
// "side" slides, and everything further away is parked out of sight.

export type SlideState = "active" | "side" | "hidden";

/** Slides further than this are parked here, out of sight, until they come back. */
export const PARK_OFFSET = 2;

/**
 * Signed distance from the active slide to slide `index` around a loop of
 * `count` slides: negative is to the left, positive to the right. When two
 * directions are equally short (the slide straight across an even loop) it
 * counts as being ahead.
 */
export function slideOffset(index: number, active: number, count: number) {
  if (count <= 0) return 0;
  let distance = (((index - active) % count) + count) % count;
  if (distance > count / 2) distance -= count;
  return distance;
}

export function slideState(offset: number): SlideState {
  const distance = Math.abs(offset);
  if (distance === 0) return "active";
  return distance === 1 ? "side" : "hidden";
}

/** Offset used for positioning: far slides wait just past the side slides. */
export function parkedOffset(offset: number) {
  return Math.max(-PARK_OFFSET, Math.min(PARK_OFFSET, offset));
}

/** The slide `step` places away from `active`, wrapping around the loop. */
export function stepIndex(active: number, step: number, count: number) {
  if (count <= 0) return 0;
  return (((active + step) % count) + count) % count;
}

export type KeyMove = { step: number } | { to: "first" | "last" } | null;

/** What a key press does to the carousel (arrow keys step, Home/End jump). */
export function keyMove(key: string): KeyMove {
  switch (key) {
    case "ArrowRight":
      return { step: 1 };
    case "ArrowLeft":
      return { step: -1 };
    case "Home":
      return { to: "first" };
    case "End":
      return { to: "last" };
    default:
      return null;
  }
}

/** Distance a finger or pointer must travel sideways to count as a swipe. */
export const SWIPE_DISTANCE = 40;

/**
 * Turns a drag into a step: dragging left moves to the next slide. Mostly
 * vertical drags are scrolling, not swiping, so they do nothing.
 */
export function swipeStep(deltaX: number, deltaY: number): number {
  if (Math.abs(deltaX) < SWIPE_DISTANCE) return 0;
  if (Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return 0;
  return deltaX < 0 ? 1 : -1;
}
