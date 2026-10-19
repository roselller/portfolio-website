import assert from "node:assert/strict";
import test from "node:test";
import { Euler, Vector3 } from "three";
import { sampleProjects } from "../src/data/projects";
import {
  fitSignpostBoards,
  getSignpostPlacement,
} from "../src/lib/signpost-fit";
import {
  PHONE_MAX_WIDTH,
  getSignpostLayout,
  getSignpostPresentation,
} from "../src/lib/signpost-layout";
import { bindSignpostPointer } from "../src/lib/signpost-pointer";

const restOffset = -Math.PI / 10;
const titles = [
  "portfolio-website",
  "live-type-translator",
  "machine-learning-projects",
  "instagram-downloader",
  "simp-city-game",
  "dsa-assignment",
];

function layoutFor(count: number) {
  return getSignpostLayout(
    Array.from({ length: count }, (_, index) => ({
      ...sampleProjects[index % sampleProjects.length],
      title: titles[index % titles.length],
    })),
  );
}
function rotationFor(width: number): [number, number, number] {
  return [-Math.PI / 16, -0.16, width >= 900 ? -0.1 : -0.08];
}

test("tablet and desktop widths keep the standard zoom and pole position", () => {
  for (const width of [PHONE_MAX_WIDTH + 1, 768, 900, 1440, 1920]) {
    const layout = layoutFor(6);
    const standard = getSignpostPresentation(
      layout.width,
      layout.height,
      width,
      750,
    );
    const placement = getSignpostPlacement(
      layout,
      width,
      750,
      { left: width * 0.06, right: width * 0.94 },
      rotationFor(width),
      restOffset,
    );
    assert.equal(placement.pixelsPerUnit, standard.pixelsPerUnit);
    assert.equal(placement.contentHeight, standard.contentHeight);
    assert.equal(placement.topX, width * (width >= 900 ? 0.67 : 0.5));
    assert.equal(placement.restOnly, false);
  }
});

test("on phones the outermost signs meet the card edges without shrinking", () => {
  for (const width of [320, 360, 390, 430, 540, PHONE_MAX_WIDTH]) {
    const layout = layoutFor(6);
    const edges = { left: Math.round(width * 0.06), right: 0 };
    edges.right = width - edges.left;
    const rotation = rotationFor(width);
    const placement = getSignpostPlacement(
      layout,
      width,
      750,
      edges,
      rotation,
      restOffset,
    );
    assert.ok(placement.restOnly);
    const standard = getSignpostPresentation(
      layout.width,
      layout.height,
      width,
      750,
    );
    assert.ok(placement.pixelsPerUnit > standard.pixelsPerUnit, `${width}px`);
    const boards = fitSignpostBoards(layout, {
      width,
      height: 750,
      documentHeight: placement.contentHeight,
      leftInset: placement.leftEdge ?? 0,
      rightEdge: placement.rightEdge,
      restOnly: placement.restOnly,
      pixelsPerUnit: placement.pixelsPerUnit,
      topX: placement.topX,
      rotation,
      restOffset,
    });
    let leftmost = Infinity;
    let rightmost = -Infinity;
    for (const [index, board] of boards.entries()) {
      // The fit must not trim any sign back from its natural width.
      assert.ok(
        Math.abs(board.scaleX - layout.boards[index].scaleX) < 1e-6,
        `${width}px: ${board.title} was shrunk`,
      );
      for (const x of [-0.24, 2.78]) {
        for (const y of [-0.301, 0.301]) {
          for (const z of [0.139, 0.331]) {
            const point = new Vector3(x * board.direction * board.scaleX, y, z)
              .applyEuler(new Euler(0, board.angle + restOffset, 0))
              .add(new Vector3(0, board.height - layout.height, 0))
              .applyEuler(new Euler(...rotation));
            const screenX = placement.topX + point.x * placement.pixelsPerUnit;
            leftmost = Math.min(leftmost, screenX);
            rightmost = Math.max(rightmost, screenX);
          }
        }
      }
    }
    assert.ok(leftmost >= edges.left - 0.5, `${width}px: left ${leftmost}`);
    assert.ok(rightmost <= edges.right + 0.5, `${width}px: right ${rightmost}`);
    assert.ok(leftmost - edges.left < 3, `${width}px: left gap ${leftmost}`);
    assert.ok(
      edges.right - rightmost < 3,
      `${width}px: right gap ${rightmost}`,
    );
  }
});

test("phone placement stays finite and bounded for any number of signs", () => {
  for (const count of [0, 1, 2, 3, 6]) {
    const layout = layoutFor(count);
    const standard = getSignpostPresentation(
      layout.width,
      layout.height,
      390,
      750,
    );
    const placement = getSignpostPlacement(
      layout,
      390,
      750,
      null,
      rotationFor(390),
      restOffset,
    );
    assert.ok(Number.isFinite(placement.pixelsPerUnit), `${count} signs`);
    assert.ok(Number.isFinite(placement.topX), `${count} signs`);
    assert.ok(placement.pixelsPerUnit > 0);
    assert.ok(placement.pixelsPerUnit <= standard.pixelsPerUnit * 2 + 1e-9);
  }
});

test("pointer tilt is off at phone width and resets after a resize", () => {
  const host = Object.assign(new EventTarget(), { innerWidth: 390 });
  const page = Object.assign(new EventTarget(), {
    hasFocus: () => true,
    visibilityState: "visible" as DocumentVisibilityState,
  });
  const angles: number[] = [];
  const cleanup = bindSignpostPointer(
    host,
    page,
    (angle) => angles.push(angle),
    () => {},
  );
  host.dispatchEvent(
    Object.assign(new Event("pointermove"), {
      clientX: 10,
      pointerType: "mouse",
    }),
  );
  assert.deepEqual(angles, [0]);
  host.innerWidth = 1000;
  host.dispatchEvent(
    Object.assign(new Event("pointermove"), {
      clientX: 0,
      pointerType: "mouse",
    }),
  );
  assert.equal(angles.at(-1), Math.PI / 18);
  host.innerWidth = 500;
  host.dispatchEvent(new Event("resize"));
  assert.equal(angles.at(-1), 0);
  cleanup();
  host.dispatchEvent(new Event("resize"));
  assert.equal(angles.length, 3);
});
