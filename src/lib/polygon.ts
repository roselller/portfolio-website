import type { Point } from "./ascii-burst";

/** Convex hull (Andrew's monotone chain). Returns the corners in order, no repeats. */
export function convexHull(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const unique = sorted.filter(
    (point, i) =>
      i === 0 || point.x !== sorted[i - 1].x || point.y !== sorted[i - 1].y,
  );
  if (unique.length < 3) return unique;
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const build = (input: readonly Point[]) => {
    const chain: Point[] = [];
    for (const point of input) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0
      ) {
        chain.pop();
      }
      chain.push(point);
    }
    chain.pop();
    return chain;
  };
  return [...build(unique), ...build([...unique].reverse())];
}

/**
 * A convex polygon pushed outwards by `distance` on every side (mitred
 * corners, capped so a thin sliver cannot spike). Any winding.
 */
export function growPolygon(
  points: readonly Point[],
  distance: number,
): Point[] {
  const count = points.length;
  if (count < 3 || distance === 0) return [...points];
  const cx = points.reduce((sum, point) => sum + point.x, 0) / count;
  const cy = points.reduce((sum, point) => sum + point.y, 0) / count;
  const normals = points.map((from, i) => {
    const to = points[(i + 1) % count];
    const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    let nx = -(to.y - from.y) / length;
    let ny = (to.x - from.x) / length;
    if (nx * ((from.x + to.x) / 2 - cx) + ny * ((from.y + to.y) / 2 - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: nx, y: ny };
  });
  return points.map((point, i) => {
    const before = normals[(i - 1 + count) % count];
    const after = normals[i];
    const scale = Math.min(
      4,
      1 / Math.max(0.25, 1 + before.x * after.x + before.y * after.y),
    );
    return {
      x: point.x + (before.x + after.x) * scale * distance,
      y: point.y + (before.y + after.y) * scale * distance,
    };
  });
}

export function perimeterOf(points: readonly Point[]) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}
