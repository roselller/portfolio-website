import assert from "node:assert/strict";
import test from "node:test";
import { formatCount } from "../src/lib/format-count";

test("small counts stay as written", () => {
  assert.equal(formatCount(0), "0");
  assert.equal(formatCount(7), "7");
  assert.equal(formatCount(999), "999");
});

test("thousands and millions are cut to K and M", () => {
  assert.equal(formatCount(1000), "1K");
  assert.equal(formatCount(1250), "1.3K");
  assert.equal(formatCount(10000), "10K");
  assert.equal(formatCount(123456), "123.5K");
  assert.equal(formatCount(1500000), "1.5M");
});
