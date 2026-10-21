import assert from "node:assert/strict";
import test from "node:test";
import {
  keyMove,
  parkedOffset,
  slideOffset,
  slideState,
  stepIndex,
  swipeStep,
} from "../src/lib/carousel";

test("offsets run around the loop, so the first and last slides are neighbours", () => {
  const offsets = (active: number) =>
    [0, 1, 2, 3, 4, 5].map((index) => slideOffset(index, active, 6));
  assert.deepEqual(offsets(0), [0, 1, 2, 3, -2, -1]);
  assert.deepEqual(offsets(5), [1, 2, 3, -2, -1, 0]);
  assert.deepEqual(offsets(3), [3, -2, -1, 0, 1, 2]);
});

test("the slide straight across an even loop counts as ahead, never both ways", () => {
  assert.equal(slideOffset(3, 0, 6), 3);
  assert.equal(slideOffset(0, 3, 6), 3);
  assert.equal(slideOffset(1, 0, 2), 1);
});

test("odd loops are symmetric and small loops do not break", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((index) => slideOffset(index, 0, 5)),
    [0, 1, 2, -2, -1],
  );
  assert.equal(slideOffset(0, 0, 1), 0);
  assert.equal(slideOffset(0, 0, 0), 0);
});

test("only the active slide and its two neighbours are visible", () => {
  assert.equal(slideState(0), "active");
  assert.equal(slideState(1), "side");
  assert.equal(slideState(-1), "side");
  assert.equal(slideState(2), "hidden");
  assert.equal(slideState(-3), "hidden");
});

test("far slides are parked just past the side slides", () => {
  assert.equal(parkedOffset(3), 2);
  assert.equal(parkedOffset(-3), -2);
  assert.equal(parkedOffset(1), 1);
  assert.equal(parkedOffset(0), 0);
});

test("stepping wraps around in both directions", () => {
  assert.equal(stepIndex(5, 1, 6), 0);
  assert.equal(stepIndex(0, -1, 6), 5);
  assert.equal(stepIndex(2, 1, 6), 3);
  assert.equal(stepIndex(2, -8, 6), 0);
  assert.equal(stepIndex(0, 1, 0), 0);
});

test("keys: arrows step, Home and End jump, anything else is ignored", () => {
  assert.deepEqual(keyMove("ArrowRight"), { step: 1 });
  assert.deepEqual(keyMove("ArrowLeft"), { step: -1 });
  assert.deepEqual(keyMove("Home"), { to: "first" });
  assert.deepEqual(keyMove("End"), { to: "last" });
  assert.equal(keyMove("Enter"), null);
  assert.equal(keyMove("a"), null);
});

test("a swipe needs enough sideways travel, and mostly vertical drags are scrolling", () => {
  assert.equal(swipeStep(-60, 5), 1);
  assert.equal(swipeStep(60, -5), -1);
  assert.equal(swipeStep(-39, 0), 0);
  assert.equal(swipeStep(-60, 80), 0);
  assert.equal(swipeStep(-60, 45), 1);
  assert.equal(swipeStep(0, 0), 0);
});
