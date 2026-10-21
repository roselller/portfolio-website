import { Vector3, type BufferGeometry, type Camera, type Mesh } from "three";
import type { Point } from "@/lib/ascii-burst";
import { convexHull } from "@/lib/polygon";

const corners = new WeakMap<BufferGeometry, Vector3[]>();

/**
 * The board's outline as 3D points: the convex hull of its footprint, once at
 * the front face and once at the back (the board is a flat rounded slab, so
 * this is exactly its silhouette from any angle). Cached per geometry; every
 * sign shares one.
 */
export function boardCorners(geometry: BufferGeometry): Vector3[] {
  const cached = corners.get(geometry);
  if (cached) return cached;
  const position = geometry.getAttribute("position");
  const footprint: Point[] = [];
  for (let i = 0; i < position.count; i++) {
    footprint.push({ x: position.getX(i), y: position.getY(i) });
  }
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const hull = convexHull(footprint);
  const points = [min.z, max.z].flatMap((z) =>
    hull.map((point) => new Vector3(point.x, point.y, z)),
  );
  corners.set(geometry, points);
  return points;
}

/** The middle of the board's slab, in the geometry's own coordinates. */
export function boardCenter(geometry: BufferGeometry): Vector3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getCenter(new Vector3());
}

const scratch = new Vector3();

/**
 * Where the board's silhouette falls on the canvas right now, in CSS pixels
 * from the canvas's top left. Reads the mesh's current transforms, so it is
 * valid between renders.
 */
export function projectedOutline(
  mesh: Mesh,
  camera: Camera,
  size: { width: number; height: number },
): Point[] {
  mesh.updateWorldMatrix(true, false);
  const projected = boardCorners(mesh.geometry).map((corner) => {
    scratch.copy(corner).applyMatrix4(mesh.matrixWorld).project(camera);
    return {
      x: (scratch.x * 0.5 + 0.5) * size.width,
      y: (-scratch.y * 0.5 + 0.5) * size.height,
    };
  });
  return convexHull(projected);
}
