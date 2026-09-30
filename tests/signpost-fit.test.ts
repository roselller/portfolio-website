import assert from "node:assert/strict";
import test from "node:test";
import { Euler, Vector3 } from "three";
import { sampleProjects } from "../src/data/projects";
import { fitSignpostBoards } from "../src/lib/signpost-fit";
import {
  getSignpostLayout,
  getSignpostPresentation,
} from "../src/lib/signpost-layout";

test("each blade stays between the card and page edge at every pointer limit and scroll position", () => {
  for (const width of [320, 390, 900, 1024, 1440, 1920]) {
    for (const count of [0, 1, 3, 6]) {
      const layout = getSignpostLayout(
        Array.from({ length: count }, (_, index) => ({
          ...sampleProjects[index],
          title: ["Orbit", "mini-tetris-game", "instagram-downloader"][
            index % 3
          ],
        })),
      );
      const height = 750;
      const documentHeight = width >= 900 ? 1392 : 800;
      const { pixelsPerUnit } = getSignpostPresentation(
        layout.width,
        layout.height,
        width,
        height,
      );
      const leftInset =
        width >= 900 ? Math.min(380, width * 0.34) + width * 0.05 : 0;
      const rotation: [number, number, number] = [
        -Math.PI / 16,
        -0.16,
        width >= 900 ? -0.1 : -0.08,
      ];
      const topX = width * (width >= 900 ? 0.67 : 0.5);
      const restOffset = -Math.PI / 10;
      const boards = fitSignpostBoards(layout, {
        width,
        height,
        documentHeight,
        leftInset,
        pixelsPerUnit,
        topX,
        rotation,
        restOffset,
      });
      const up = new Vector3(0, 1, 0).applyEuler(new Euler(...rotation));
      const left = Math.max(16, width * 0.02, leftInset);
      const right = width - Math.max(16, width * 0.02);
      assert.equal(boards.length, count);
      for (const [index, board] of boards.entries()) {
        assert.ok(board.width > 0 && board.fontSize > 0);
        assert.ok(board.width <= layout.boards[index].width);
        assert.equal(board.height, layout.boards[index].height);
        for (const scroll of [
          0,
          (documentHeight - height) / 2,
          documentHeight - height,
        ]) {
          for (let step = 0; step <= 30; step++) {
            const pointer = -Math.PI / 9 + (step / 30) * (Math.PI / 6);
            for (const x of [-0.24, 2.78]) {
              for (const y of [-0.301, 0.301]) {
                for (const z of [0.139, 0.331]) {
                  const point = new Vector3(
                    x * board.direction * board.scaleX,
                    y,
                    z,
                  )
                    .applyEuler(
                      new Euler(0, board.angle + restOffset + pointer, 0),
                    )
                    .add(new Vector3(0, board.height - layout.height, 0))
                    .applyEuler(new Euler(...rotation));
                  const screenX =
                    topX + point.x * pixelsPerUnit + (scroll * up.x) / up.y;
                  assert.ok(
                    screenX >= left && screenX <= right,
                    `${width}px / ${count} signs / ${board.title}: ${screenX} outside ${left}–${right}`,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
});
