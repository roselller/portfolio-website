"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
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
  const [tabVisible, setTabVisible] = useState(true);
  const region = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const justSwiped = useRef(false);
  const tiltFrame = useRef(0);

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
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(tiltFrame.current);
    };
  }, []);

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
    const move = keyMove(event.key);
    if (!move) return;
    event.preventDefault();
    if ("step" in move) stepBy(move.step);
    else goTo(move.to === "first" ? 0 : count - 1);
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

  // The focused card leans towards the pointer. The pointer's place on the card
  // is handed to CSS as two numbers from -1 to 1; the angle limit lives in CSS
  // (--carousel-tilt), so there is one value to turn.
  function onTiltMove(event: PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const card = event.currentTarget;
    const box = card.parentElement?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = requestAnimationFrame(() => {
      card.style.setProperty("--tilt-x", String(Math.max(-1, Math.min(1, x))));
      card.style.setProperty("--tilt-y", String(Math.max(-1, Math.min(1, y))));
    });
  }
  function onTiltEnd(event: PointerEvent<HTMLElement>) {
    cancelAnimationFrame(tiltFrame.current);
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
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
            >
              <ButtonAscii />
              {state === "active" ? (
                <Link
                  className="carousel-card"
                  href={`/projects/${project.slug}`}
                  onPointerMove={onTiltMove}
                  onPointerLeave={onTiltEnd}
                >
                  <CardContent
                    project={project}
                    index={index}
                    sample={sample}
                  />
                </Link>
              ) : (
                // Side cards are for the pointer only; keyboard and screen
                // reader users move with the dots, the arrow keys and the link.
                <div className="carousel-card" onClick={() => goTo(index)}>
                  <CardContent
                    project={project}
                    index={index}
                    sample={sample}
                  />
                </div>
              )}
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
