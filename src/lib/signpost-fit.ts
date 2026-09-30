import { Euler, Matrix4, Vector3 } from "three";
import {
  BOARD_TEMPLATE_WIDTH,
  type SignboardLayout,
  type getSignpostLayout,
} from "./signpost-layout";

type Layout = ReturnType<typeof getSignpostLayout>;
type View = {
  width: number;
  height: number;
  documentHeight: number;
  leftInset: number;
  pixelsPerUnit: number;
  topX: number;
  rotation: [number, number, number];
  restOffset: number;
};

// The bundled board's bounds, including the label faces and hover movement.
const corners = [-0.24, 2.78].flatMap((x) =>
  [-0.301, 0.301].flatMap((y) => [0.139, 0.331].map((z) => [x, y, z])),
);

function horizontalBounds(
  board: SignboardLayout,
  scale: number,
  matrix: Matrix4,
  restOffset: number,
) {
  const [low, high] = [
    board.angle + restOffset - Math.PI / 9,
    board.angle + restOffset + Math.PI / 18,
  ];
  const m = matrix.elements;
  let min = Infinity;
  let max = -Infinity;
  for (const [x, y, z] of corners) {
    const scaledX = x * board.direction * scale;
    const cosine = m[0] * scaledX + m[8] * z;
    const sine = m[0] * z - m[8] * scaledX;
    const phase = Math.atan2(sine, cosine);
    const angles = [low, high];
    // Include the extrema between the pointer limits, not just the endpoints.
    for (let turn = -2; turn <= 2; turn++) {
      const angle = phase + turn * Math.PI;
      if (angle > low && angle < high) angles.push(angle);
    }
    for (const angle of angles) {
      const value =
        cosine * Math.cos(angle) + sine * Math.sin(angle) + m[4] * y;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return { min, max };
}

/** Fit each blade to the actual space beside the card throughout its motion. */
export function fitSignpostBoards(layout: Layout, view: View) {
  const matrix = new Matrix4().makeRotationFromEuler(
    new Euler(...view.rotation),
  );
  const up = new Vector3(0, 1, 0).applyMatrix4(matrix);
  const gutter = Math.max(16, view.width * 0.02);
  const left = Math.max(gutter, view.leftInset);
  const right = view.width - gutter;
  const scrollDrift =
    Math.max(0, view.documentHeight - view.height) * (up.x / up.y);

  return layout.boards.map((board) => {
    const poleX =
      view.topX + (board.height - layout.height) * up.x * view.pixelsPerUnit;
    const fits = (scale: number) => {
      const bounds = horizontalBounds(board, scale, matrix, view.restOffset);
      return (
        poleX + Math.min(0, scrollDrift) + bounds.min * view.pixelsPerUnit >=
          left + 2 &&
        poleX + Math.max(0, scrollDrift) + bounds.max * view.pixelsPerUnit <=
          right - 2
      );
    };
    let scaleX = board.scaleX;
    if (!fits(scaleX)) {
      let low = 0;
      let high = scaleX;
      for (let step = 0; step < 18; step++) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
      scaleX = low;
    }
    const titleWidth = (BOARD_TEMPLATE_WIDTH - 1.52) * scaleX;
    return {
      ...board,
      scaleX,
      width: BOARD_TEMPLATE_WIDTH * scaleX,
      titleWidth,
      fontSize: Math.min(
        0.3,
        titleWidth / Math.max(1, Array.from(board.title).length * 0.7),
      ),
    };
  });
}
