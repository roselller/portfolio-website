import assert from "node:assert/strict";
import test from "node:test";
import {
  createQuickTween,
  easeOutQuad,
  IDLE_FRAMES_BEFORE_SLEEP,
} from "../src/lib/quick-tween";

/** A clock and frame queue the test drives by hand. */
function setup(durationMs = 180) {
  let time = 0;
  let nextId = 1;
  const queue = new Map<number, () => void>();
  const state = { value: 0, updates: 0 };
  const tween = createQuickTween({
    read: () => state.value,
    write: (value) => {
      state.value = value;
    },
    onUpdate: () => {
      state.updates++;
    },
    durationMs,
    now: () => time,
    requestFrame: (callback) => {
      const id = nextId++;
      queue.set(id, callback);
      return id;
    },
    cancelFrame: (id) => {
      queue.delete(id);
    },
  });
  return {
    state,
    tween,
    pending: () => queue.size,
    /** Move the clock and run the frame that was waiting, if any. */
    frameAt(ms: number) {
      time = ms;
      const callbacks = [...queue.values()];
      queue.clear();
      for (const callback of callbacks) callback();
    },
    setTime(ms: number) {
      time = ms;
    },
  };
}

test("easing is power1.out: fast start, gentle finish", () => {
  assert.equal(easeOutQuad(0), 0);
  assert.equal(easeOutQuad(0.5), 0.75);
  assert.equal(easeOutQuad(1), 1);
});

test("a move eases over 180 ms and lands exactly on the target", () => {
  const { state, tween, frameAt } = setup();
  tween.to(-0.4);
  assert.equal(state.value, 0, "nothing moves before the first frame");
  frameAt(90);
  assert.ok(
    Math.abs(state.value - -0.3) < 1e-12,
    "75% of the way at half time",
  );
  frameAt(179);
  assert.ok(state.value < -0.39 && state.value > -0.4);
  frameAt(200);
  assert.equal(state.value, -0.4);
});

test("an ease starts at the last frame's time, as GSAP's did", () => {
  const { state, tween, frameAt, setTime } = setup();
  tween.to(1);
  frameAt(0);
  frameAt(16);
  // A pointer event arrives at 20 ms, between frames. The ease counts from the
  // frame at 16 ms, so the frame at 33 ms is 17 ms into it.
  setTime(20);
  tween.to(-1);
  const before = state.value;
  frameAt(33);
  const expected = before + (-1 - before) * easeOutQuad(17 / 180);
  assert.ok(Math.abs(state.value - expected) < 1e-12);
});

test("a new target mid-flight starts from where the value is now", () => {
  const { state, tween, frameAt, setTime } = setup();
  tween.to(1);
  frameAt(90);
  assert.equal(state.value, 0.75);
  setTime(90);
  tween.to(-1);
  frameAt(180);
  // Half way through the second ease: 0.75 + (-1 - 0.75) * 0.75.
  assert.ok(Math.abs(state.value - -0.5625) < 1e-12);
  frameAt(270);
  assert.equal(state.value, -1);
});

test("pause freezes the value; the next move carries on from there", () => {
  const { state, tween, frameAt, setTime } = setup();
  tween.to(1);
  frameAt(90);
  tween.pause();
  const frozen = state.value;
  const updates = state.updates;
  frameAt(106);
  frameAt(500);
  assert.equal(state.value, frozen);
  assert.equal(state.updates, updates, "a paused ease draws nothing");
  setTime(500);
  tween.to(0);
  frameAt(590);
  assert.ok(Math.abs(state.value - frozen * 0.25) < 1e-12);
});

test("kill cancels the running ease and ignores later moves", () => {
  const { state, tween, frameAt, pending } = setup();
  tween.to(1);
  frameAt(30);
  tween.kill();
  assert.equal(pending(), 0);
  const stopped = state.value;
  tween.to(-1);
  assert.equal(pending(), 0);
  frameAt(400);
  assert.equal(state.value, stopped);
});

test("moving to the value it already has draws nothing", () => {
  const { state, tween, pending, frameAt } = setup();
  tween.to(0);
  assert.equal(pending(), 0, "nothing to start");
  tween.to(0.5);
  frameAt(500);
  assert.equal(state.value, 0.5);
  const updates = state.updates;
  tween.to(0.5);
  frameAt(516);
  assert.equal(state.updates, updates);
  // Going back to the current value while an ease is waiting cancels it.
  tween.to(0.9);
  tween.to(0.5);
  frameAt(532);
  frameAt(600);
  assert.equal(state.value, 0.5);
  assert.equal(state.updates, updates);
});

test("onUpdate runs once per frame that wrote a value", () => {
  const { state, tween, frameAt } = setup();
  tween.to(1);
  assert.equal(state.updates, 0);
  frameAt(60);
  frameAt(120);
  frameAt(180);
  assert.equal(state.updates, 3);
  frameAt(196);
  assert.equal(state.updates, 3, "finished: later frames only read the clock");
});

test("several moves between two frames cost one frame request", () => {
  const { tween, pending } = setup();
  tween.to(0.1);
  tween.to(0.2);
  tween.to(0.3);
  assert.equal(pending(), 1);
});

test("frames stop after the idle spell, and the next move starts from its own time", () => {
  const { state, tween, frameAt, pending, setTime } = setup();
  tween.to(1);
  let t = 0;
  while (state.value !== 1) frameAt((t += 16));
  for (let i = 0; i < IDLE_FRAMES_BEFORE_SLEEP - 1; i++) {
    assert.equal(pending(), 1, "still ticking, but only reading the clock");
    frameAt((t += 16));
  }
  assert.equal(pending(), 0, "asleep: nothing is scheduled");
  const updates = state.updates;
  t += 5000;
  setTime(t);
  tween.to(0);
  assert.equal(pending(), 1);
  frameAt(t + 18);
  // Counted from the call (the clock was asleep), not from 5 s ago.
  assert.ok(Math.abs(state.value - (1 - easeOutQuad(18 / 180))) < 1e-12);
  assert.ok(state.updates > updates);
});

test("a stalled clock (hidden tab) restarts the ease from the call", () => {
  const { state, tween, frameAt, setTime } = setup();
  tween.to(1);
  frameAt(0);
  frameAt(16);
  const before = state.value;
  // The tab was hidden: no frame for 10 s, the request is still pending.
  setTime(10_016);
  tween.to(0);
  frameAt(10_032);
  // 16 ms into the new ease, not 10 s: it has hardly started.
  const expected = before - before * easeOutQuad(16 / 180);
  assert.ok(Math.abs(state.value - expected) < 1e-12);
});
