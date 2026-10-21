"use client";

import { useEffect, useRef } from "react";
import {
  alphaFor,
  glyphFor,
  particlePosition,
  progressOf,
  spawnParticle,
  stepParticles,
  type Particle,
} from "@/lib/ascii-burst";

const FONT_SIZE = 11;
const FONT = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
const MAX_PARTICLES = 160;
const MAX_FRAME_SECONDS = 0.05;
// Below this much room beside the button, skip the characters.
const MIN_SPREAD = 10;

/**
 * ASCII characters that drift outward from behind a hovered or keyboard-focused
 * button. It sits inside the button (the parent element), is hidden from
 * assistive technology, and does nothing on touch screens or when the visitor
 * prefers reduced motion. The canvas is only created on first use, and the
 * animation loop stops once the last character has faded.
 */
export function ButtonAscii() {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const host = root?.parentElement;
    if (!root || !host) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let hovering = false;
    let focused = false;
    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    let particles: Particle[] = [];
    let frame = 0;
    let last = 0;
    let carry = 0;
    let spread = 40;
    let color = "#fb7185";
    let box = { width: 0, height: 0 };

    const canRun = () =>
      finePointer.matches &&
      !reducedMotion.matches &&
      !host.matches(":disabled") &&
      host.getAttribute("aria-disabled") !== "true";

    /** Sizes the canvas. Returns false when there is no room for a burst. */
    function measure() {
      host!.style.removeProperty("--ascii-spread");
      const style = getComputedStyle(host!);
      const configured =
        parseFloat(style.getPropertyValue("--ascii-spread")) || 40;
      color = style.getPropertyValue("--button-glow").trim() || color;
      // A full-width button on a narrow screen has less room beside it than the
      // configured spread. Shrink the burst so the canvas never makes the page
      // scroll sideways (the 8px covers the button's hover pop), and skip it
      // when the gutter is too small to be worth drawing in.
      const rect = host!.getBoundingClientRect();
      const room =
        Math.min(rect.left, document.documentElement.clientWidth - rect.right) -
        8;
      spread = Math.min(configured, Math.floor(room));
      if (spread < MIN_SPREAD) return false;
      host!.style.setProperty("--ascii-spread", `${spread}px`);
      box = { width: host!.offsetWidth, height: host!.offsetHeight };
      if (!canvas) {
        canvas = document.createElement("canvas");
        root!.appendChild(canvas);
        context = canvas.getContext("2d");
      }
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.ceil((box.width + spread * 2) * ratio);
      canvas.height = Math.ceil((box.height + spread * 2) * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      return true;
    }

    function stopLoop() {
      cancelAnimationFrame(frame);
      frame = 0;
      particles = [];
      carry = 0;
      delete host!.dataset.fx;
      context?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
    }

    function draw() {
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = color;
      for (const particle of particles) {
        const progress = progressOf(particle);
        const { x, y } = particlePosition(particle);
        context.globalAlpha = alphaFor(progress) * 0.9;
        context.fillText(glyphFor(progress), x + spread, y + spread);
      }
      context.globalAlpha = 1;
    }

    function tick(now: number) {
      const dt = Math.min(MAX_FRAME_SECONDS, (now - last) / 1000);
      last = now;
      const spawning = (hovering || focused) && canRun();
      particles = stepParticles(particles, dt);
      if (spawning) {
        const perimeter = 2 * (box.width + box.height);
        carry += Math.min(110, Math.max(40, perimeter / 4)) * dt;
        while (carry >= 1 && particles.length < MAX_PARTICLES) {
          particles.push(spawnParticle(box, spread));
          carry -= 1;
        }
        carry = Math.min(carry, 1);
      }
      draw();
      if (!spawning && particles.length === 0) {
        stopLoop();
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (!canRun() || !measure()) return;
      host!.dataset.fx = "on";
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovering = true;
      start();
    };
    const onLeave = () => {
      hovering = false;
    };
    const onFocus = () => {
      if (!host.matches(":focus-visible")) return;
      focused = true;
      start();
    };
    const onBlur = () => {
      focused = false;
    };

    // A button that was disabled (sending, or showing green/red) while hovered
    // can come back with the pointer still over it and no new pointerenter.
    // Browsers also skip pointerleave/blur on disabled controls, so re-read
    // the truth from :hover and :focus-visible whenever the state changes.
    const onStateChange = () => {
      hovering = host.matches(":hover");
      focused = host.matches(":focus-visible");
      if (hovering || focused) start();
    };
    const observer = new MutationObserver(onStateChange);
    observer.observe(host, {
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });

    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("focus", onFocus);
    host.addEventListener("blur", onBlur);
    return () => {
      observer.disconnect();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("focus", onFocus);
      host.removeEventListener("blur", onBlur);
      stopLoop();
    };
  }, []);

  return <span ref={rootRef} className="button-ascii" aria-hidden="true" />;
}
