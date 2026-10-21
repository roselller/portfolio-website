// Particle math for the ASCII burst behind hovered buttons. Pure and
// DOM-free so it can be tested; ButtonAscii draws the result on a canvas.
//
// Coordinates are CSS pixels relative to the button's top-left corner.

/** Densest to lightest, so a particle thins out as it drifts away. */
export const ASCII_RAMP = [
  "@",
  "%",
  "#",
  "*",
  "+",
  "=",
  "-",
  ":",
  ".",
] as const;

/**
 * Numbers shared by every burst (buttons and the 3D signs), so they look alike.
 * The glow and lift numbers of a hover are in hover-effect.ts.
 */
export const ASCII_FONT_SIZE = 11;
export const ASCII_FONT = `${ASCII_FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
export const MAX_PARTICLES = 160;
export const MAX_FRAME_SECONDS = 0.05;
/** How far, in CSS pixels, the characters may travel from the edge. */
export const DEFAULT_SPREAD = 40;
export const PARTICLE_ALPHA = 0.9;

/** Characters born per second for a shape with this perimeter. */
export function spawnRate(perimeter: number) {
  return Math.min(110, Math.max(40, perimeter / 4));
}

/** How far from the edge's outward normal a particle may drift, in radians. */
export const MAX_SPREAD_ANGLE = (35 * Math.PI) / 180;

export type Box = { width: number; height: number };
export type Point = { x: number; y: number };

export type Particle = {
  /** Where it was born, on the button's edge. */
  x0: number;
  y0: number;
  /** Unit direction of travel (always has an outward component). */
  dx: number;
  dy: number;
  /** Distance covered by the end of its life. */
  travel: number;
  age: number;
  life: number;
};

export type Random = () => number;

/** Spawns a particle on a random point of the button's perimeter. */
export function spawnParticle(
  box: Box,
  spread: number,
  random: Random = Math.random,
): Particle {
  const { width, height } = box;
  let t = random() * 2 * (width + height);
  let x0: number;
  let y0: number;
  let nx = 0;
  let ny = 0;
  if (t < width) {
    x0 = t;
    y0 = 0;
    ny = -1;
  } else if ((t -= width) < height) {
    x0 = width;
    y0 = t;
    nx = 1;
  } else if ((t -= height) < width) {
    x0 = t;
    y0 = height;
    ny = 1;
  } else {
    t -= width;
    x0 = 0;
    y0 = Math.min(t, height);
    nx = -1;
  }
  const angle = (random() * 2 - 1) * MAX_SPREAD_ANGLE;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x0,
    y0,
    dx: nx * cos - ny * sin,
    dy: nx * sin + ny * cos,
    // Never more than 95% of the room the canvas has around the button.
    travel: spread * (0.45 + 0.5 * random()),
    age: 0,
    life: 0.7 + 0.6 * random(),
  };
}

/**
 * Spawns a particle on a random point of a convex polygon's outline (screen
 * coordinates, any winding), drifting away from the polygon's middle. Returns
 * null for a shape with no outline to speak of. Particle coordinates are the
 * polygon's own, not relative to a corner.
 */
export function spawnParticleOnPolygon(
  points: readonly Point[],
  spread: number,
  random: Random = Math.random,
): Particle | null {
  const count = points.length;
  if (count < 2) return null;
  let perimeter = 0;
  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % count];
    perimeter += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (!(perimeter > 0)) return null;
  let t = random() * perimeter;
  let from = points[0];
  let to = points[1 % count];
  let length = Math.hypot(to.x - from.x, to.y - from.y);
  for (let i = 0; i < count; i++) {
    from = points[i];
    to = points[(i + 1) % count];
    length = Math.hypot(to.x - from.x, to.y - from.y);
    if (t < length) break;
    t -= length;
  }
  const along = length > 0 ? Math.min(1, t / length) : 0;
  const x0 = from.x + (to.x - from.x) * along;
  const y0 = from.y + (to.y - from.y) * along;
  // Edge normal, pointing away from the middle of the shape.
  let nx = length > 0 ? -(to.y - from.y) / length : 0;
  let ny = length > 0 ? (to.x - from.x) / length : 0;
  const cx = points.reduce((sum, point) => sum + point.x, 0) / count;
  const cy = points.reduce((sum, point) => sum + point.y, 0) / count;
  if (nx * (x0 - cx) + ny * (y0 - cy) < 0) {
    nx = -nx;
    ny = -ny;
  }
  const angle = (random() * 2 - 1) * MAX_SPREAD_ANGLE;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x0,
    y0,
    dx: nx * cos - ny * sin,
    dy: nx * sin + ny * cos,
    travel: spread * (0.45 + 0.5 * random()),
    age: 0,
    life: 0.7 + 0.6 * random(),
  };
}

/** 0 at birth, 1 at the end of life. */
export function progressOf(particle: Particle) {
  return Math.min(1, Math.max(0, particle.age / particle.life));
}

/** Eases out: quick off the edge, slowing as it fades. */
export function particlePosition(particle: Particle) {
  const p = progressOf(particle);
  const eased = 1 - (1 - p) * (1 - p);
  return {
    x: particle.x0 + particle.dx * particle.travel * eased,
    y: particle.y0 + particle.dy * particle.travel * eased,
  };
}

export function glyphFor(progress: number) {
  const index = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(progress * ASCII_RAMP.length)),
  );
  return ASCII_RAMP[index];
}

/** Fades in over the first 12% of life, then out. */
export function alphaFor(progress: number) {
  return Math.min(1, progress / 0.12) * Math.pow(1 - progress, 1.2);
}

/** Ages every particle by `dt` seconds and drops the ones that have ended. */
export function stepParticles(particles: Particle[], dt: number): Particle[] {
  const next: Particle[] = [];
  for (const particle of particles) {
    const age = particle.age + dt;
    if (age < particle.life) next.push({ ...particle, age });
  }
  return next;
}
