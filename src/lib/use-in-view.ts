"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether `ref` is on screen. With `once`, it stays true after the first time
 * (for entrance animations that play a single time).
 */
export function useInView(
  ref: RefObject<Element | null>,
  { threshold = 0.3, once = false } = {},
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, once]);
  return inView;
}
