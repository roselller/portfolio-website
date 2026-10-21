import {
  alphaFor,
  ASCII_FONT,
  DEFAULT_SPREAD,
  glyphFor,
  MAX_FRAME_SECONDS,
  MAX_PARTICLES,
  PARTICLE_ALPHA,
  particlePosition,
  progressOf,
  spawnParticleOnPolygon,
  spawnRate,
  stepParticles,
  type Particle,
  type Point,
} from "./ascii-burst";
import {
  GLOW_BLUR_PX,
  GLOW_OPACITY_SCALE,
  GLOW_SPREAD_PX,
  HOVER_GLOW,
} from "./hover-effect";
import { growPolygon, perimeterOf } from "./polygon";

type Entry = {
  /** The sign's outline on the canvas, read again every frame. */
  outline: () => Point[] | null;
  hovering: boolean;
  /** 0 to HOVER_GLOW, eased towards its target. */
  glow: number;
  particles: Particle[];
  carry: number;
  color: string;
};

// The glow follows its target with this time constant, about the .3s of .button.
const GLOW_RATE = 12;
const GLOW_DONE = 0.004;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The glow and the ASCII characters of a hovered 3D sign: the same two layers a
 * hovered button has, drawn on a 2D canvas that sits behind the WebGL canvas
 * (so, like on a button, both pass behind the sign itself). The lift and pop
 * are the scene's job (SignArm). Each sign is tracked by id, so one can fade
 * out while the next fades in. Enter and leave can be repeated safely; the loop
 * stops once every glow and character is gone.
 */
export class SignHoverFx {
  private entries = new Map<string, Entry>();
  private context: CanvasRenderingContext2D | null;
  private frame = 0;
  private last = 0;
  private ratio = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.context = canvas.getContext("2d");
  }

  /** Mouse-like pointers only, and nothing when motion is reduced. */
  static available() {
    return (
      window.matchMedia(FINE_POINTER).matches &&
      !window.matchMedia(REDUCED_MOTION).matches
    );
  }

  enter(id: string, outline: () => Point[] | null) {
    if (!SignHoverFx.available() || !this.context) return;
    let entry = this.entries.get(id);
    if (!entry) {
      entry = {
        outline,
        hovering: true,
        glow: 0,
        particles: [],
        carry: 0,
        color: "#fb7185",
      };
      this.entries.set(id, entry);
    }
    entry.outline = outline;
    entry.hovering = true;
    entry.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-glow")
        .trim() || entry.color;
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  leave(id: string) {
    const entry = this.entries.get(id);
    if (entry) entry.hovering = false;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.entries.clear();
    this.clear();
  }

  private clear() {
    this.context?.setTransform(1, 0, 0, 1, 0, 0);
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private fitCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(this.canvas.clientWidth * ratio);
    const height = Math.round(this.canvas.clientHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.ratio = ratio;
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private tick = (now: number) => {
    const context = this.context;
    if (!context) return;
    const dt = Math.min(MAX_FRAME_SECONDS, (now - this.last) / 1000);
    this.last = now;
    this.fitCanvas();
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const [id, entry] of this.entries) {
      const outline = entry.outline();
      const target = entry.hovering ? HOVER_GLOW : 0;
      entry.glow += (target - entry.glow) * (1 - Math.exp(-GLOW_RATE * dt));
      entry.particles = stepParticles(entry.particles, dt);
      if (outline && entry.hovering) this.spawn(entry, outline, dt);
      if (outline) this.drawGlow(outline, entry);
      this.drawParticles(entry);
      if (
        !entry.hovering &&
        entry.glow < GLOW_DONE &&
        entry.particles.length === 0
      ) {
        this.entries.delete(id);
      }
    }
    if (this.entries.size === 0) {
      this.frame = 0;
      this.clear();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private spawn(entry: Entry, outline: Point[], dt: number) {
    entry.carry += spawnRate(perimeterOf(outline)) * dt;
    while (entry.carry >= 1 && entry.particles.length < MAX_PARTICLES) {
      const particle = spawnParticleOnPolygon(outline, DEFAULT_SPREAD);
      if (!particle) break;
      entry.particles.push(particle);
      entry.carry -= 1;
    }
    entry.carry = Math.min(entry.carry, 1);
  }

  /**
   * The halo of `.button::after` (`0 0 16px 2px`) around the outline. Only the
   * shadow is wanted, so the shape is drawn far off the canvas and its shadow
   * is offset back into place; one fill keeps the shadow even all round.
   */
  private drawGlow(outline: Point[], entry: Entry) {
    const context = this.context;
    if (!context || entry.glow < GLOW_DONE) return;
    const shape = growPolygon(outline, GLOW_SPREAD_PX);
    const away = this.canvas.width + 400;
    context.save();
    context.globalAlpha = entry.glow * GLOW_OPACITY_SCALE;
    context.shadowColor = entry.color;
    // Shadow settings ignore the canvas transform, so they are in device pixels.
    context.shadowBlur = GLOW_BLUR_PX * this.ratio;
    context.shadowOffsetX = away * this.ratio;
    context.fillStyle = "#000";
    context.beginPath();
    shape.forEach((point, i) => {
      if (i === 0) context.moveTo(point.x - away, point.y);
      else context.lineTo(point.x - away, point.y);
    });
    context.closePath();
    context.fill();
    context.restore();
  }

  private drawParticles(entry: Entry) {
    const context = this.context;
    if (!context || entry.particles.length === 0) return;
    context.save();
    context.font = ASCII_FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = entry.color;
    for (const particle of entry.particles) {
      const progress = progressOf(particle);
      const { x, y } = particlePosition(particle);
      context.globalAlpha = alphaFor(progress) * PARTICLE_ALPHA;
      context.fillText(glyphFor(progress), x, y);
    }
    context.restore();
  }
}
