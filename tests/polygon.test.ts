import assert from "node:assert/strict";
import test from "node:test";
import { convexHull, growPolygon, perimeterOf } from "../src/lib/polygon";

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

test("the hull of a point cloud keeps only the outer corners", () => {
  const cloud = [
    ...square,
    { x: 5, y: 5 },
    { x: 2, y: 8 },
    { x: 10, y: 5 }, // on an edge
    { x: 0, y: 0 }, // repeated
  ];
  const hull = convexHull(cloud);
  assert.equal(hull.length, 4);
  for (const corner of square) {
    assert.ok(hull.some((p) => p.x === corner.x && p.y === corner.y));
  }
});

test("hulls of a handful of points do not break", () => {
  assert.deepEqual(convexHull([]), []);
  assert.equal(convexHull([{ x: 1, y: 1 }]).length, 1);
  assert.equal(
    convexHull([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ]).length,
    1,
  );
  assert.ok(
    convexHull([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]).length <= 3,
  );
});

test("a polygon grows by the same distance on every side, in either winding", () => {
  for (const points of [square, [...square].reverse()]) {
    const grown = growPolygon(points, 2);
    const xs = grown.map((p) => p.x);
    const ys = grown.map((p) => p.y);
    assert.equal(Math.min(...xs), -2);
    assert.equal(Math.max(...xs), 12);
    assert.equal(Math.min(...ys), -2);
    assert.equal(Math.max(...ys), 12);
  }
});

test("a sliver cannot grow a spike", () => {
  const sliver = [
    { x: 0, y: 0 },
    { x: 100, y: 0.01 },
    { x: 0, y: 0.02 },
  ];
  const grown = growPolygon(sliver, 2);
  for (const p of grown) assert.ok(Math.abs(p.x) < 100 + 2 * 4 + 1);
});

test("the perimeter adds up", () => {
  assert.equal(perimeterOf(square), 40);
});
