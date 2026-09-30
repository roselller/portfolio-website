import assert from "node:assert/strict";
import test from "node:test";
import { bindSignpostPointer } from "../src/lib/signpost-pointer";
import {
  getSignpostLayout,
  getSignpostPresentation,
} from "../src/lib/signpost-layout";
import { sampleProjects } from "../src/data/projects";

test("cursor rotation pauses on blur/hidden, ignores inactive and touch input, and cleans up", () => {
  const host = Object.assign(new EventTarget(), { innerWidth: 1000 });
  let focused = true;
  const page = Object.assign(new EventTarget(), {
    hasFocus: () => focused,
    visibilityState: "visible" as DocumentVisibilityState,
  });
  const angles: number[] = [];
  let pauses = 0;
  const cleanup = bindSignpostPointer(
    host,
    page,
    (angle) => angles.push(angle),
    () => pauses++,
  );
  const move = (x: number, type = "mouse") =>
    host.dispatchEvent(
      Object.assign(new Event("pointermove"), {
        clientX: x,
        pointerType: type,
      }),
    );
  move(0);
  move(500);
  move(1000);
  move(2000);
  assert.deepEqual(angles, [Math.PI / 18, -0, -Math.PI / 9, -Math.PI / 9]);
  focused = false;
  host.dispatchEvent(new Event("blur"));
  move(250);
  assert.equal(pauses, 1);
  assert.equal(angles.length, 4);
  focused = true;
  host.dispatchEvent(new Event("focus"));
  assert.equal(angles.length, 4, "focus alone must not replay stale movement");
  page.visibilityState = "hidden";
  page.dispatchEvent(new Event("visibilitychange"));
  move(750);
  assert.equal(pauses, 2);
  assert.equal(angles.length, 4);
  page.visibilityState = "visible";
  move(500, "touch");
  assert.equal(angles.length, 4);
  move(500);
  assert.equal(Math.abs(angles.at(-1)!), 0);
  cleanup();
  move(1000);
  host.dispatchEvent(new Event("blur"));
  assert.equal(angles.length, 5);
  assert.equal(pauses, 3);
});

test("more equally sized boards extend the document without shrinking existing boards", () => {
  for (const canvasWidth of [320, 390, 900, 1200]) {
    let previousHeight = 0;
    let scale = 0;
    for (const count of [1, 2, 3, 4, 5, 6, 8, 9, 12, 25, 100]) {
      const projects = Array.from({ length: count }, (_, index) => ({
        ...sampleProjects[index % 8],
        slug: `project-${index}`,
        title: "Layout fixture",
      }));
      const layout = getSignpostLayout(projects);
      const view = getSignpostPresentation(
        layout.width,
        layout.height,
        canvasWidth,
        750,
      );
      assert.ok(view.contentHeight > previousHeight);
      if (scale) assert.equal(view.pixelsPerUnit, scale);
      assert.ok(Number.isFinite(view.pixelsPerUnit) && view.pixelsPerUnit > 0);
      previousHeight = view.contentHeight;
      scale = view.pixelsPerUnit;
    }
  }
});
