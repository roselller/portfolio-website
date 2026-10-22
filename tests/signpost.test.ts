import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { sampleProjects } from "../src/data/projects";
import {
  getSignpostLayout,
  getSignpostScale,
  signpostThemes,
  toSignText,
} from "../src/lib/signpost-layout";

function projects(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...sampleProjects[index % sampleProjects.length],
    id: `fixture-${index}`,
    slug: `project-${index}`,
    signOrder: index,
  }));
}

test("adding and removing projects updates boards and routes without an eight-board limit", () => {
  const original = projects(8);
  const added = [
    ...original,
    {
      ...original[0],
      id: "new",
      slug: "new-project",
      title: "New project",
      signOrder: 8,
    },
  ];
  const nine = getSignpostLayout(added);
  assert.equal(nine.boards.length, 9);
  assert.equal(nine.boards[8].href, "/projects/new-project");
  assert.equal(nine.boards[8].number, "09");
  const removed = getSignpostLayout(
    added.filter((project) => project.slug !== "project-3"),
  );
  assert.equal(removed.boards.length, 8);
  assert.ok(
    !removed.boards.some((board) => board.project.slug === "project-3"),
  );
  assert.equal(removed.boards.at(-1)?.href, "/projects/new-project");
  assert.equal(removed.boards.at(-1)?.number, "08");
});

test("renaming or reordering projects with the same count updates labels and positions", () => {
  const items = projects(3);
  const updated = [
    { ...items[2], title: "Renamed destination" },
    items[0],
    items[1],
  ];
  const layout = getSignpostLayout(updated);
  assert.equal(layout.boards[0].title, "RENAMED DESTINATION");
  assert.equal(layout.boards[0].href, "/projects/project-2");
  assert.equal(layout.boards[1].project.slug, "project-0");
  assert.equal(items[2].title, sampleProjects[2].title);
});

test("the pole and framing contain every board for small and large collections", () => {
  for (const count of [1, 2, 3, 4, 5, 6, 8, 9, 12, 25, 100]) {
    const layout = getSignpostLayout(projects(count));
    assert.equal(layout.boards.length, count);
    for (const [index, board] of layout.boards.entries()) {
      assert.ok(board.height - 0.3 > 0.92, "blades must clear the base");
      assert.ok(
        board.height + 0.3 < layout.poleTop,
        "shaft must reach all blades",
      );
      if (index)
        assert.ok(
          layout.boards[index - 1].height - board.height > 0.6,
          "adjacent blades must not touch",
        );
    }
    for (const [width, height] of [
      [3, 6],
      [7, 6],
      [10, 8],
    ]) {
      const scale = getSignpostScale(
        layout.width,
        layout.height,
        width,
        height,
      );
      assert.ok(Number.isFinite(scale) && scale > 0);
      assert.ok((layout.width + layout.height * 0.1) * scale <= width);
      assert.ok((layout.height + layout.width * 0.1) * scale <= height);
    }
  }
  assert.deepEqual(getSignpostLayout([]).boards, []);
  assert.equal(getSignpostLayout([]).height, 0);
});

test("all boards use the requested inverse theme colours and rose arrows, with the pole opposite the boards", () => {
  assert.deepEqual(signpostThemes.dark, {
    board: "#e7e9ec",
    ink: "#16181c",
    arrow: "#9f1239",
    pole: null,
  });
  assert.deepEqual(signpostThemes.light, {
    board: "#16181c",
    ink: "#f2f3f5",
    arrow: "#fb7185",
    pole: "#e7e9ec",
  });
});

test("the reusable Blender kit contains unlabelled components and no scene lights", () => {
  const data = readFileSync(
    new URL("../public/models/signpost-parts.glb", import.meta.url),
  );
  assert.equal(data.toString("ascii", 0, 4), "glTF");
  assert.equal(data.readUInt32LE(8), data.length);
  const json = JSON.parse(
    data.subarray(20, 20 + data.readUInt32LE(12)).toString(),
  );
  const names = new Set(json.nodes.map((node: { name: string }) => node.name));
  for (const name of ["Board", "Mount", "Foot", "Shaft", "Cap"])
    assert.ok(names.has(name));
  assert.equal(json.images, undefined);
  assert.equal(json.cameras, undefined);
  assert.ok(
    !JSON.stringify(json).includes("/projects/orbit"),
    "template must not contain a fixed project link",
  );
});

test("sign text is uppercased and limited to characters the sign font contains", () => {
  assert.equal(toSignText("Form & Field"), "FORM & FIELD");
  assert.equal(toSignText("portfolio_site.v2-cli"), "PORTFOLIO_SITE.V2-CLI");
  assert.equal(toSignText("Café — “Été”…"), "CAFÉ — “ÉTÉ”…");
  // Outside the font: would make troika request a blocked fallback font.
  assert.equal(toSignText("東京 Trip"), "?? TRIP");
  assert.equal(toSignText("Wave 🌊"), "WAVE ?");
  assert.equal(toSignText("Tab\there"), "TAB?HERE");
  assert.equal(toSignText("ÿ"), "?"); // uppercases to U+0178, which is not in the font
  // The browser locale must not change the result (Turkish uppercases i to İ).
  assert.equal(toSignText("live"), "LIVE");
  assert.equal(toSignText("Straße"), "STRASSE");
});
