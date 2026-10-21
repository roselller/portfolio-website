import assert from "node:assert/strict";
import test from "node:test";
import { formatRetrievedAt } from "../src/lib/retrieved-at";

test("the time is shown as day, month name, year and a 24-hour clock", () => {
  const iso = "2026-10-21T05:43:00.000Z";
  assert.equal(formatRetrievedAt(iso, "Asia/Singapore"), "21 Oct 2026, 13:43");
  assert.equal(formatRetrievedAt(iso, "UTC"), "21 Oct 2026, 05:43");
  assert.equal(
    formatRetrievedAt(iso, "America/Los_Angeles"),
    "20 Oct 2026, 22:43",
  );
});

test("midnight reads 00:00, never 24:00", () => {
  assert.equal(
    formatRetrievedAt("2026-10-21T16:00:00.000Z", "Asia/Singapore"),
    "22 Oct 2026, 00:00",
  );
});

test("a time that cannot be read gives nothing", () => {
  assert.equal(formatRetrievedAt("not a date"), null);
  assert.equal(formatRetrievedAt(""), null);
});
