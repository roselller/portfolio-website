import { Euler, Matrix4, Vector3 } from "three";
import {
  BOARD_TEMPLATE_WIDTH,
  PHONE_MAX_WIDTH,
  getSignpostPresentation,
  type SignboardLayout,
  type getSignpostLayout,
} from "./signpost-layout";

type Layout = ReturnType<typeof getSignpostLayout>;
type View = {
  width: number;
  height: number;
  documentHeight: number;
  pixelsPerUnit: number;
  topX: number;
  rotation: [number, number, number];
  restOffset: number;
  /** Phones: fit the rest pose only, because touch never tilts the signpost. */
  restOnly?: boolean;
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
  restOnly = false,
) {
  const [low, high] = restOnly
    ? [board.angle + restOffset, board.angle + restOffset]
    : [
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

/**
 * The page's side gutter in px: the header card's inset (--page-gutter in
 * globals.css: 3%, 6% at 899px and below).
 */
export function pageGutter(width: number) {
  return width * (width <= 899 ? 0.06 : 0.03);
}

/** Fit each blade to the space between the page gutters throughout its motion. */
export function fitSignpostBoards(layout: Layout, view: View) {
  const matrix = new Matrix4().makeRotationFromEuler(
    new Euler(...view.rotation),
  );
  const up = new Vector3(0, 1, 0).applyMatrix4(matrix);
  const gutter = pageGutter(view.width);
  const left = gutter;
  const right = view.width - gutter;
  const scrollDrift =
    Math.max(0, view.documentHeight - view.height) * (up.x / up.y);

  return layout.boards.map((board) => {
    const poleX =
      view.topX + (board.height - layout.height) * up.x * view.pixelsPerUnit;
    const fits = (scale: number) => {
      const bounds = horizontalBounds(
        board,
        scale,
        matrix,
        view.restOffset,
        view.restOnly,
      );
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

/** The horizontal extent of all the signs at rest, in scene units from the pole. */
export function signpostRestExtent(
  layout: Layout,
  rotation: [number, number, number],
  restOffset: number,
) {
  const matrix = new Matrix4().makeRotationFromEuler(new Euler(...rotation));
  const up = new Vector3(0, 1, 0).applyMatrix4(matrix);
  let min = Infinity;
  let max = -Infinity;
  for (const board of layout.boards) {
    const bounds = horizontalBounds(
      board,
      board.scaleX,
      matrix,
      restOffset,
      true,
    );
    const offset = (board.height - layout.height) * up.x;
    min = Math.min(min, bounds.min + offset);
    max = Math.max(max, bounds.max + offset);
  }
  return { min, max };
}

/**
 * Where the signpost sits in the canvas. The middle of the signs (not the
 * pole) is at the middle of the page. Phones scale it so the outermost signs
 * (at rest) meet the page gutters; every other width keeps the standard zoom.
 */
export function getSignpostPlacement(
  layout: Layout,
  width: number,
  height: number,
  rotation: [number, number, number],
  restOffset: number,
) {
  const base = getSignpostPresentation(
    layout.width,
    layout.height,
    width,
    height,
  );
  if (layout.boards.length === 0) {
    return {
      ...base,
      topX: width / 2,
      restOnly: false,
    };
  }
  if (width > PHONE_MAX_WIDTH) {
    // Centre the signs at their natural size. Where the fit has to trim a
    // board (narrow desktops) they sit a little off-centre rather than being
    // squeezed further to balance the two sides.
    const { min, max } = signpostRestExtent(layout, rotation, restOffset);
    return {
      ...base,
      topX:
        max > min
          ? width / 2 - ((min + max) / 2) * base.pixelsPerUnit
          : width / 2,
      restOnly: false,
    };
  }

  const left = pageGutter(width);
  const right = width - left;
  const { min, max } = signpostRestExtent(layout, rotation, restOffset);
  // Stay inside the 2 px tolerance used by fitSignpostBoards, plus a hair
  // (0.05 px per side) so rounding never trims a sign.
  const span = right - left - 4.1;
  if (!(max > min) || !(span > 0)) {
    return { ...base, topX: width / 2, restOnly: false };
  }
  // One or two signs lean to one side; cap the zoom so they never balloon.
  const pixelsPerUnit = Math.min(span / (max - min), base.pixelsPerUnit * 2);
  const used = (max - min) * pixelsPerUnit;
  // Centre the signs between the edges when the zoom was capped.
  const topX = left + 2.05 + (span - used) / 2 - min * pixelsPerUnit;
  return {
    pixelsPerUnit,
    contentHeight: Math.ceil(layout.height * pixelsPerUnit + 64),
    topX,
    restOnly: true,
  };
}
