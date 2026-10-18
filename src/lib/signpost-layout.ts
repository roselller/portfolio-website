import type { Project } from "@/data/projects";

export const BOARD_TEMPLATE_WIDTH = 3.02;
export const BOARD_TEMPLATE_CENTER = 1.27;
const spacing = 0.71;
const lowestBoard = 2.33;
const angles = [42, 18, 48, 14, 44, 20, 40, 16];

export const signpostThemes = {
  dark: { board: "#e7e9ec", ink: "#16181c", arrow: "#9f1239" },
  light: { board: "#16181c", ink: "#f2f3f5", arrow: "#fb7185" },
} as const;

export type SignpostTheme =
  (typeof signpostThemes)[keyof typeof signpostThemes];

// Characters contained in public/fonts/Monocraft-SemiBold.ttf (the sign font).
// If the 3D text needs any other character, troika tries to download a fallback
// font from a CDN. The site's CSP blocks that, and the whole scene then stays
// blank, so unsupported characters are replaced instead.
const UNSUPPORTED_SIGN_CHARACTER =
  /[^\u0020-\u007E\u00A0-\u00AC\u00AE-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/gu;

/**
 * The uppercase text painted on a sign, limited to what the sign font can draw.
 * Locale-independent: a Turkish locale would turn "i" into "İ", which the font lacks.
 */
export function toSignText(title: string) {
  return title.toUpperCase().replace(UNSUPPORTED_SIGN_CHARACTER, "?");
}

/** Layout follows the complete project collection; there is no fixed slot limit. */
export function getSignpostLayout(projects: readonly Project[]) {
  const boards = projects.map((project, index) => {
    const title = toSignText(project.title);
    const width = Math.min(4.2, Math.max(3.02, 2.35 + title.length * 0.12));
    const scaleX = width / BOARD_TEMPLATE_WIDTH;
    const titleWidth = (BOARD_TEMPLATE_WIDTH - 1.52) * scaleX;
    return {
      project,
      number: String(index + 1).padStart(2, "0"),
      title,
      href: `/projects/${encodeURIComponent(project.slug)}`,
      height: lowestBoard + (projects.length - index - 1) * spacing,
      direction: index % 2 ? -1 : 1,
      angle: (angles[index % angles.length] * Math.PI) / 180,
      scaleX,
      width,
      titleWidth,
      fontSize: Math.min(
        0.3,
        titleWidth / Math.max(1, Array.from(title).length * 0.7),
      ),
    };
  });
  const poleTop = boards.length ? boards[0].height + 0.5 : 0;
  const height = poleTop ? poleTop + 0.155 : 0;
  // Conservative width bound for every authored arm angle.
  const width = boards.length
    ? Math.max(...boards.map((board) => board.width)) * 2 + 0.25
    : 0;
  return { boards, poleTop, height, width };
}

export type SignboardLayout = ReturnType<
  typeof getSignpostLayout
>["boards"][number];

export function getSignpostScale(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  if (!height || !width) return 1;
  return Math.min(
    1,
    viewportWidth / ((width + height * 0.1) * 1.08),
    viewportHeight / ((height + width * 0.1) * 1.08),
  );
}

export const SIGNPOST_MAGNIFICATION = 3.2;

/** Fixed board size as the collection grows; only the document height changes. */
export function getSignpostPresentation(
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const referenceHeight = 7.955; // Eight-board composition at the previous 100% size.
  const base = Math.min(
    canvasWidth / ((width + referenceHeight * 0.1) * 1.08),
    Math.max(600, canvasHeight) / ((referenceHeight + width * 0.1) * 1.08),
  );
  // Retain the reference board height; each blade fits the available horizontal
  // space independently in signpost-fit.ts.
  const pixelsPerUnit =
    0.612 *
    0.85 *
    (canvasWidth >= 900
      ? base * SIGNPOST_MAGNIFICATION
      : Math.min(base * 1.6, canvasWidth / Math.max(1, width * 0.84)));
  const referencePageHeight = Math.max(
    canvasWidth >= 600 ? 1392 : 0,
    referenceHeight * pixelsPerUnit + 64,
  );
  return {
    pixelsPerUnit,
    contentHeight: Math.ceil(
      referencePageHeight + (height - referenceHeight) * pixelsPerUnit,
    ),
  };
}
