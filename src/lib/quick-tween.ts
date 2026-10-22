/** GSAP's `power1.out`: starts fast, settles gently. */
export function easeOutQuad(progress: number) {
  return 1 - (1 - progress) * (1 - progress);
}

/** Frames that keep ticking, doing nothing, after the last ease (GSAP's autoSleep). */
export const IDLE_FRAMES_BEFORE_SLEEP = 120;
/** A last tick older than this is a stalled or hidden tab, not a running clock (GSAP's lag threshold). */
const STALE_CLOCK_MS = 500;

export type QuickTweenOptions = {
  read: () => number;
  write: (value: number) => void;
  /** Called once after every frame that wrote a value. */
  onUpdate?: () => void;
  durationMs?: number;
  /** Clock and frame scheduler; replaced in tests. */
  now?: () => number;
  requestFrame?: (callback: () => void) => number;
  cancelFrame?: (id: number) => void;
};

export type QuickTween = {
  /** Ease from the current value to `target`; a running ease is replaced. */
  to: (target: number) => void;
  /** Freeze at the current value. The next `to` carries on from there. */
  pause: () => void;
  /** Stop for good. Later `to` calls do nothing. */
  kill: () => void;
};

/**
 * Follows a moving target the way `gsap.quickTo` did: every call starts a
 * fresh ease from wherever the value is now.
 *
 * Timing matches GSAP's on purpose. An ease starts at the time of the most
 * recent frame, not at the moment of the call. Browsers deliver pointer events
 * just before a frame, so the ease has already run for one frame when that
 * frame is drawn; starting at the call time instead would make the tilt trail
 * the cursor by a frame. To know that time, the frame callback keeps running
 * (it only reads the clock) for a couple of seconds after the last ease, then
 * stops, so an idle page schedules nothing and the scene is drawn only while
 * a value changes.
 */
export function createQuickTween({
  read,
  write,
  onUpdate,
  durationMs = 180,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(() => callback()),
  cancelFrame = (id) => cancelAnimationFrame(id),
}: QuickTweenOptions): QuickTween {
  let from = 0;
  let target = 0;
  let startedAt = 0;
  let lastFrameAt = 0;
  let easing = false;
  let idleFrames = 0;
  let frame: number | null = null;
  let killed = false;

  function cancel() {
    if (frame === null) return;
    cancelFrame(frame);
    frame = null;
  }

  function step() {
    frame = null;
    lastFrameAt = now();
    if (easing) {
      const progress = Math.min(1, (lastFrameAt - startedAt) / durationMs);
      // Land exactly on the target instead of 1 - (1 - 1)^2 rounding.
      write(
        progress === 1
          ? target
          : from + (target - from) * easeOutQuad(progress),
      );
      onUpdate?.();
      if (progress === 1) easing = false;
    }
    idleFrames = easing ? 0 : idleFrames + 1;
    if (easing || idleFrames < IDLE_FRAMES_BEFORE_SLEEP) {
      frame = requestFrame(step);
    }
  }

  return {
    to(next) {
      if (killed) return;
      const current = read();
      if (current === next) {
        // Already there: nothing to animate.
        easing = false;
        return;
      }
      const time = now();
      // No frames running (asleep) or a stalled clock: start from now.
      if (frame === null || time - lastFrameAt > STALE_CLOCK_MS) {
        lastFrameAt = time;
      }
      from = current;
      target = next;
      startedAt = lastFrameAt;
      easing = true;
      idleFrames = 0;
      if (frame === null) frame = requestFrame(step);
    },
    pause() {
      easing = false;
    },
    kill() {
      killed = true;
      easing = false;
      cancel();
    },
  };
}
