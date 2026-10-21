import assert from "node:assert/strict";
import test from "node:test";
import {
  alphaFor,
  ASCII_RAMP,
  glyphFor,
  particlePosition,
  spawnParticle,
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
