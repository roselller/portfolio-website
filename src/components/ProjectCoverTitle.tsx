"use client";

import { useLayoutEffect, useRef } from "react";

export function ProjectCoverTitle({ title }: { title: string }) {
  const container = useRef<HTMLHeadingElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const frame = container.current;
    const word = text.current;
    if (!frame || !word) return;
    let active = true;
    function fit() {
      if (!active || !frame || !word) return;
      word.style.fontSize = "";
      const size = Number.parseFloat(getComputedStyle(word).fontSize);
      const width = word.getBoundingClientRect().width;
      if (width > frame.clientWidth) {
        word.style.fontSize = `${size * ((frame.clientWidth - 1) / width)}px`;
      }
    }
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    fit();
    void document.fonts.ready.then(fit);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [title]);

  return (
    <h1 className="project-visual-title" ref={container}>
      <span className="project-visual-word" ref={text}>
        {title}
        <span style={{ color: "var(--accent-glow)" }}>.</span>
      </span>
    </h1>
  );
}
