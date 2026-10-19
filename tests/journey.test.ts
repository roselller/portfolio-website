import assert from "node:assert/strict";
import test from "node:test";
import { formatMonth, journey, sortedJourney } from "../src/data/journey";

test("the timeline lists entries by start date, newest first", () => {
  const starts = sortedJourney().map((entry) => entry.start);
  assert.deepEqual(starts, [...starts].sort().reverse());
  assert.equal(starts.length, journey.length);
});

test("timeline dates read as short month and year", () => {
  assert.equal(formatMonth("2026-08"), "Aug 2026");
  assert.equal(formatMonth("2021-04"), "Apr 2021");
  for (const { start, end } of journey) {
    assert.match(start, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.match(end, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.ok(end >= start, `${start} must not be after ${end}`);
  }
});
