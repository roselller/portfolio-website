"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Project } from "@/data/projects";
import {
  keyMove,
  parkedOffset,
  slideOffset,
  slideState,
  stepIndex,
  swipeStep,
} from "@/lib/carousel";
import { formatCount } from "@/lib/format-count";
import { ProjectCoverTitle } from "./ProjectCoverTitle";
import { ButtonAscii } from "./ui/ButtonAscii";
import { useProjectView } from "./ProjectViewProvider";

// How long each project stays in focus while the carousel moves on its own.
const AUTO_ADVANCE_MS = 5000;
// A click that lands right after a swipe is the swipe's own, not a tap.
const SWIPE_CLICK_GUARD_MS = 350;
// Mouse effects only for devices that really hover, like ButtonAscii.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeToVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function CardContent({
  project,
  index,
  sample,
}: {
  project: Project;
  index: number;
  sample: boolean;
}) {
  return (
    <>
      <span className="carousel-card-number">
        {String(index + 1).padStart(2, "0")} /{" "}
        {(project.isSample ?? sample) ? "CONCEPT" : "PROJECT"}
      </span>
      <ArrowUpRight
        className="carousel-card-arrow"
        size={22}
        aria-hidden="true"
      />
      <div className="carousel-card-main">
        <ProjectCoverTitle title={project.title} as="h3" />
        <p className="carousel-card-about">{project.shortDescription}</p>
      </div>
      <div className="carousel-card-meta">
        <div className="tag-list">
          {project.techStack.slice(0, 2).map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        {project.stars != null && (
          <span className="carousel-card-stars">
            <Star size={14} aria-hidden="true" />
            {formatCount(project.stars)}
            <span className="sr-only"> stars</span>
          </span>
        )}
      </div>
    </>
  );
}

/**
 * The list view of the Work page: the project in focus in the middle, its
 * neighbours faded out on either side, and dots underneath. It moves on its
 * own until the visitor takes over (any click, swipe or key press stops it for
 * good), pauses while the pointer or keyboard focus is on it, the tab is
 * hidden or it is off screen, and never moves when motion is reduced.
 */
export function ProjectCarousel({
  projects,
  sample,
}: {
  projects: Project[];
  sample: boolean;
}) {
  const { reduced } = useProjectView();
  const count = projects.length;
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  // A page opened in a background tab starts out paused, not playing.
  const tabVisible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
  const region = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const justSwiped = useRef(false);
  const tiltFrame = useRef(0);
  // Set by a key press made on a card, so focus follows the card that takes over.
  const refocusCard = useRef(false);

  const current = count ? ((active % count) + count) % count : 0;
  const autoplay = !reduced && !stopped && count > 1;
  const paused = hovering || focusWithin || !onScreen || !tabVisible;

  useEffect(() => {
    if (!autoplay || paused) return;
    const timer = window.setTimeout(
      () => setActive((index) => stepIndex(index, 1, count)),
      AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, paused, current, count]);

  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(tiltFrame.current);
    };
  }, []);

  // A card that stops being the focused one drops its lean, so it does not
  // carry a stale angle into its next turn; a key press made on a card moves
  // keyboard focus to the card that took over (the old one is now a side card).
  useLayoutEffect(() => {
    const root = region.current;
    if (!root) return;
    cancelAnimationFrame(tiltFrame.current);
    for (const slide of root.querySelectorAll<HTMLElement>(
      '.carousel-slide:not([data-state="active"])',
    )) {
      slide.style.removeProperty("--tilt-x");
      slide.style.removeProperty("--tilt-y");
    }
    if (!refocusCard.current) return;
    refocusCard.current = false;
    root
      .querySelector<HTMLElement>(
        '.carousel-slide[data-state="active"] .carousel-card',
      )
      ?.focus({ preventScroll: true });
  }, [current]);

  // Anything the visitor does hands the carousel over to them for good.
  function goTo(index: number) {
    setActive(index);
    setStopped(true);
  }
  function stepBy(step: number) {
    setActive((index) => stepIndex(index, step, count));
    setStopped(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // Browser and system shortcuts (Alt+Left for back, Cmd+Arrow, ...) are not ours.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const move = keyMove(event.key);
    if (!move) return;
    event.preventDefault();
    const target =
      "step" in move
        ? stepIndex(current, move.step, count)
        : move.to === "first"
          ? 0
          : count - 1;
    // Only when the focused card changes will the layout effect above run.
    refocusCard.current =
      target !== current &&
      event.target instanceof Element &&
      event.target.closest(".carousel-card") !== null;
    goTo(target);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // Mouse users click side cards and dots; dragging is for fingers and pens.
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const step = swipeStep(event.clientX - start.x, event.clientY - start.y);
    if (!step) return;
    stepBy(step);
    justSwiped.current = true;
    window.setTimeout(() => {
      justSwiped.current = false;
    }, SWIPE_CLICK_GUARD_MS);
  }

  // The focused card leans towards the pointer. The pointer's place on its slide
  // is handed to CSS as two numbers from -1 to 1 (set on the slide, which never
  // tilts, so the pointer is measured against a box that stays put; the card
  // inherits them. Never register them with @property: that stops the
  // inheriting). The angle limit lives in CSS (--carousel-tilt).
  function onTiltMove(event: PointerEvent<HTMLElement>) {
    if (
      reduced ||
      event.pointerType !== "mouse" ||
      !window.matchMedia(FINE_POINTER).matches
    ) {
      return;
    }
    // React clears these after the handler returns, so take them now.
    const slide = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = requestAnimationFrame(() => {
      const box = slide.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = ((clientX - box.left) / box.width) * 2 - 1;
      const y = ((clientY - box.top) / box.height) * 2 - 1;
      slide.style.setProperty("--tilt-x", String(Math.max(-1, Math.min(1, x))));
      slide.style.setProperty("--tilt-y", String(Math.max(-1, Math.min(1, y))));
    });
  }
  function onTiltEnd(event: PointerEvent<HTMLElement>) {
    cancelAnimationFrame(tiltFrame.current);
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
  }
  // A click on a side card brings it into focus; with a modifier held it is
  // an ordinary link again (new tab and so on).
  function onSideCardClick(event: MouseEvent<HTMLElement>, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    goTo(index);
  }

  return (
    <section
      ref={region}
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Projects"
      onKeyDown={onKeyDown}
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false);
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
    >
      <div
        className="carousel-track"
        aria-live={autoplay && !paused ? "off" : "polite"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        onClickCapture={(event) => {
          if (!justSwiped.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {projects.map((project, index) => {
          const offset = slideOffset(index, current, count);
          const state = slideState(offset);
          const side = offset < 0 ? "left" : "right";
          return (
            <div
              key={project.slug}
              className="carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={state === "active" ? undefined : true}
              data-state={state}
              data-side={state === "active" ? undefined : side}
              // The focused card tilts instead of bursting; its neighbours are
              // clipped by the track, so the burst never widens the page.
              data-ascii={state === "active" ? "off" : undefined}
              data-ascii-contained=""
              inert={state === "hidden"}
              style={{ "--offset": parkedOffset(offset) } as CSSProperties}
              onPointerMove={state === "active" ? onTiltMove : undefined}
              onPointerLeave={onTiltEnd}
            >
              <ButtonAscii />
              {/* One element for every state, so keyboard focus stays on the
                  card when it changes places and its blur and tilt can ease.
                  Side cards are for the pointer only (no tab stop, not
                  announced); keyboard and screen reader users move with the
                  dots, the arrow keys and the focused card's link. */}
              <Link
                className="carousel-card"
                href={`/projects/${project.slug}`}
                prefetch={state === "active" ? undefined : false}
                tabIndex={state === "active" ? undefined : -1}
                onClick={
                  state === "active"
                    ? undefined
                    : (event) => onSideCardClick(event, index)
                }
              >
                <CardContent project={project} index={index} sample={sample} />
              </Link>
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div
          className="carousel-dots"
          role="group"
          aria-label="Choose a project"
        >
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              className="carousel-dot"
              aria-label={`Show ${project.title}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
