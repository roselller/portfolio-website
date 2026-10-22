"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useThree } from "@react-three/fiber";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    observer.disconnect();
    motion.removeEventListener("change", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}
function snapshot() {
  return `${document.documentElement.dataset.theme === "dark" ? "dark" : "light"}|${window.matchMedia("(prefers-reduced-motion: reduce)").matches}|${document.visibilityState}`;
}

// The gradient follows clock time, so drawing ~30 frames a second instead of
// every display refresh keeps the same speed at about half the GPU work.
const FRAME_INTERVAL_MS = 33;

function RenderPolicy({ paused }: { paused: boolean }) {
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    setFrameloop("demand");
    invalidate();
    if (paused) return;
    const timer = window.setInterval(invalidate, FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, setFrameloop, invalidate]);
  return null;
}

export default function ShaderBackground() {
  const state = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "light|true|hidden",
  );
  const [theme, reduced, visibility] = state.split("|");
  const light = theme === "light";
  const paused = reduced === "true" || visibility !== "visible";
  return (
    <ShaderGradientCanvas
      pixelDensity={1}
      pointerEvents="none"
      lazyLoad={false}
      powerPreference="low-power"
    >
      <RenderPolicy paused={paused} />
      <ShaderGradient
        control="props"
        type="plane"
        animate={paused ? "off" : "on"}
        color1={light ? "#fb7185" : "#9f1239"}
        color2={light ? "#e7e9ec" : "#34363a"}
        color3={light ? "#d1d5da" : "#0b0c0e"}
        uSpeed={0.4}
        uStrength={4}
        uAmplitude={1}
        uDensity={1.3}
        uFrequency={5.5}
        uTime={0}
        cDistance={3.6}
        cPolarAngle={90}
        cAzimuthAngle={180}
        rotationY={10}
        rotationZ={50}
        positionX={-1.4}
        lightType="3d"
        brightness={1.2}
        reflection={0.1}
        grain="on"
        enableTransition={false}
        enableCameraUpdate={false}
      />
    </ShaderGradientCanvas>
  );
}
