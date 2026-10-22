"use client";

import { useId, useSyncExternalStore } from "react";
import { m, useReducedMotion } from "framer-motion";

const storageKey = "portfolio-theme";
const themeEvent = "portfolio-theme-change";

function subscribe(notify: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    document.documentElement.dataset.theme =
      event.newValue === "dark" ? "dark" : "light";
    notify();
  }
  window.addEventListener(themeEvent, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(themeEvent, notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  const maskId = useId();
  const reduced = useReducedMotion();
  const light = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme !== "dark",
    () => true,
  );
  const label = `Switch to ${light ? "dark" : "light"} mode`;

  function toggleTheme() {
    const next = light ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The switch still works when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <m.svg
        viewBox="0 0 24 24"
        width="23"
        height="23"
        aria-hidden="true"
        initial={false}
        animate={{ rotate: light ? 0 : -20 }}
        transition={{ duration: reduced ? 0 : 0.45 }}
      >
        <defs>
          <mask id={maskId}>
            <rect width="24" height="24" fill="white" />
            <m.circle
              r="6"
              fill="black"
              initial={false}
              animate={{ cx: light ? 29 : 16, cy: light ? -5 : 7 }}
              transition={{ duration: reduced ? 0 : 0.45 }}
            />
          </mask>
        </defs>
        <m.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: light ? 5 : 8 }}
          transition={{ duration: reduced ? 0 : 0.45 }}
        />
        <m.g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: light ? 1 : 0, rotate: light ? 0 : 45 }}
          style={{ transformOrigin: "12px 12px" }}
          transition={{ duration: reduced ? 0 : 0.35 }}
        >
          <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </m.g>
      </m.svg>
    </button>
  );
}
