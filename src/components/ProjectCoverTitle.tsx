"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * The project name set large and shrunk to fit its box. `as` picks the heading
 * level: the project page uses the page's single h1, cards use h3.
 */
export function ProjectCoverTitle({
  title,
  as: Heading = "h1",
}: {
  title: string;
  as?: "h1" | "h3";
}) {
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
      const style = getComputedStyle(word);
      const size = Number.parseFloat(style.fontSize);
      // The used layout width, which ignores transforms: a card that is scaled
      // down or tilted must be fitted by its real size, not its drawn size.
      const width = Number.parseFloat(style.width);
      if (!(width > 0)) return;
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
    <Heading className="project-visual-title" ref={container}>
      <span className="project-visual-word" ref={text}>
        {title}
        <span style={{ color: "var(--accent-glow)" }}>.</span>
      </span>
    </Heading>
  );
}
