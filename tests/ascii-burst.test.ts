import assert from "node:assert/strict";
import test from "node:test";
import {
  alphaFor,
  ASCII_RAMP,
  glyphFor,
  MAX_SPREAD_ANGLE,
  particlePosition,
  spawnParticle,
  spawnParticleOnPolygon,
  stepParticles,
  type Box,
  type Particle,
} from "../src/lib/ascii-burst";

/** Small deterministic generator so failures are reproducible. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const box: Box = { width: 200, height: 53 };
const spread = 40;

/** Straight-line distance from the button's rectangle (0 when inside). */
function distanceOutside(point: { x: number; y: number }) {
  const ox = Math.max(0, -point.x, point.x - box.width);
  const oy = Math.max(0, -point.y, point.y - box.height);
  return Math.hypot(ox, oy);
}

function snapshots(particle: Particle, steps = 40) {
  const positions = [];
  for (let i = 0; i <= steps; i++) {
    positions.push(
      particlePosition({ ...particle, age: (particle.life * i) / steps }),
    );
  }
  return positions;
}

test("particles are born on the button's edge", () => {
  const random = seeded(1);
  for (let i = 0; i < 500; i++) {
    const p = spawnParticle(box, spread, random);
    const onVerticalEdge = p.x0 === 0 || p.x0 === box.width;
    const onHorizontalEdge = p.y0 === 0 || p.y0 === box.height;
    assert.ok(
      onVerticalEdge || onHorizontalEdge,
      `off the edge: ${p.x0},${p.y0}`,
    );
    assert.ok(p.x0 >= 0 && p.x0 <= box.width);
    assert.ok(p.y0 >= 0 && p.y0 <= box.height);
    assert.ok(Math.abs(Math.hypot(p.dx, p.dy) - 1) < 1e-9, "unit direction");
  }
});

test("a particle only ever moves away from the button", () => {
  const random = seeded(2);
  for (let i = 0; i < 300; i++) {
    const positions = snapshots(spawnParticle(box, spread, random));
    for (let step = 1; step < positions.length; step++) {
      assert.ok(
        distanceOutside(positions[step]) >=
          distanceOutside(positions[step - 1]) - 1e-9,
        "moved back toward the button",
      );
    }
  }
});

test("particles never leave the canvas around the button", () => {
  const random = seeded(3);
  for (let i = 0; i < 500; i++) {
    const p = spawnParticle(box, spread, random);
    for (const position of snapshots(p)) {
      assert.ok(distanceOutside(position) <= spread * 0.95 + 1e-9);
    }
  }
});

test("stepParticles ages particles and removes the ones that ended", () => {
  const random = seeded(4);
  const born = Array.from({ length: 20 }, () =>
    spawnParticle(box, spread, random),
  );
  const later = stepParticles(born, 0.5);
  for (const p of later) assert.equal(p.age, 0.5);
  assert.ok(later.length <= born.length);
  assert.equal(stepParticles(born, 2).length, 0);
  assert.equal(born[0].age, 0, "input is not mutated");
});

test("glyphs thin out from dense to light and cover the whole ramp", () => {
  assert.equal(glyphFor(0), ASCII_RAMP[0]);
  assert.equal(glyphFor(1), ASCII_RAMP[ASCII_RAMP.length - 1]);
  assert.equal(glyphFor(-5), ASCII_RAMP[0]);
  assert.equal(glyphFor(5), ASCII_RAMP[ASCII_RAMP.length - 1]);
  let last = 0;
  for (let i = 0; i <= 100; i++) {
    const index = ASCII_RAMP.indexOf(glyphFor(i / 100));
    assert.ok(index >= last);
    last = index;
  }
});

test("alpha starts at zero, peaks early and ends at zero", () => {
  assert.equal(alphaFor(0), 0);
  assert.equal(alphaFor(1), 0);
  assert.ok(alphaFor(0.12) > alphaFor(0.6));
  for (let i = 0; i <= 100; i++) {
    const alpha = alphaFor(i / 100);
    assert.ok(alpha >= 0 && alpha <= 1);
  }
});

test("polygon particles are born on the outline and drift outwards", () => {
  const random = seeded(7);
  // A tilted rectangle, like a sign seen at an angle, in either winding.
  const tilted = [
    { x: 100, y: 40 },
    { x: 260, y: 70 },
    { x: 250, y: 120 },
    { x: 90, y: 90 },
  ];
  for (const polygon of [tilted, [...tilted].reverse()]) {
    const cx = polygon.reduce((sum, p) => sum + p.x, 0) / 4;
    const cy = polygon.reduce((sum, p) => sum + p.y, 0) / 4;
    for (let i = 0; i < 400; i++) {
      const particle = spawnParticleOnPolygon(polygon, spread, random)!;
      // Born on an edge: find the nearest one and its outward normal.
      let nearest = { distance: Infinity, nx: 0, ny: 0 };
      polygon.forEach((a, k) => {
        const b = polygon[(k + 1) % 4];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const t = Math.max(
          0,
          Math.min(
            1,
            ((particle.x0 - a.x) * (b.x - a.x) +
              (particle.y0 - a.y) * (b.y - a.y)) /
              length ** 2,
          ),
        );
        const px = a.x + t * (b.x - a.x);
        const py = a.y + t * (b.y - a.y);
        const distance = Math.hypot(particle.x0 - px, particle.y0 - py);
        if (distance >= nearest.distance) return;
        let nx = -(b.y - a.y) / length;
        let ny = (b.x - a.x) / length;
        if (nx * (px - cx) + ny * (py - cy) < 0) {
          nx = -nx;
          ny = -ny;
        }
        nearest = { distance, nx, ny };
      });
      assert.ok(
        nearest.distance < 1e-6,
        `off the outline by ${nearest.distance}`,
      );
      // A unit direction within the spread angle of the outward normal.
      assert.ok(Math.abs(Math.hypot(particle.dx, particle.dy) - 1) < 1e-9);
      assert.ok(
        particle.dx * nearest.nx + particle.dy * nearest.ny >=
          Math.cos(MAX_SPREAD_ANGLE) - 1e-9,
      );
      assert.ok(
        particle.travel >= spread * 0.45 && particle.travel <= spread * 0.95,
      );
    }
  }
});

test("a shape with no outline spawns nothing", () => {
  assert.equal(spawnParticleOnPolygon([], spread), null);
  assert.equal(spawnParticleOnPolygon([{ x: 1, y: 1 }], spread), null);
  assert.equal(
    spawnParticleOnPolygon(
      [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
      spread,
    ),
    null,
  );
});
