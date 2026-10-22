"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SignpostSceneClient } from "./three/SignpostSceneClient";
import { ProjectCarousel } from "./ProjectCarousel";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { Project } from "@/data/projects";

import { useProjectView } from "./ProjectViewProvider";
import { bindSignpostPointer } from "@/lib/signpost-pointer";
import { createQuickTween } from "@/lib/quick-tween";
import { PHONE_MAX_WIDTH } from "@/lib/signpost-layout";

export function SignpostHero({
  projects,
  sample,
  children,
}: {
  projects: Project[];
  sample: boolean;
  children: ReactNode;
}) {
  const hero = useRef<HTMLElement>(null);
  const rotation = useRef(0);
  const scrollOffset = useRef(0);
  const [sceneHeight, setSceneHeight] = useState(1400);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [leftInset, setLeftInset] = useState(0);
  // Phones: the card's left and right edges, so the signs can meet them.
  const [phoneEdges, setPhoneEdges] = useState<{
    left: number;
    right: number;
  } | null>(null);
  const renderSceneRef = useRef<(() => void) | null>(null);
  const { grid } = useProjectView();

  useEffect(() => {
    rotation.current = 0;
    renderSceneRef.current?.();
    if (grid || projects.length === 0) return;
    const turn = createQuickTween({
      read: () => rotation.current,
      write: (angle) => {
        rotation.current = angle;
      },
      onUpdate: () => renderSceneRef.current?.(),
    });
    const unbind = bindSignpostPointer(window, document, turn.to, turn.pause);
    return () => {
      unbind();
      turn.kill();
    };
  }, [grid, projects.length]);

  // List view: the focused project card is as tall as the intro card beside
  // it, whatever its text makes of that, so its height is handed to CSS. This
  // runs before paint, so switching to the list view never shows a first frame
  // at the CSS fallback height.
  useLayoutEffect(() => {
    if (!grid) return;
    const root = hero.current;
    const card = root?.querySelector<HTMLElement>(".hero-copy");
    if (!root || !card) return;
    const measure = () =>
      root.style.setProperty(
        "--intro-card-height",
        `${card.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    measure();
    return () => {
      observer.disconnect();
      root.style.removeProperty("--intro-card-height");
    };
  }, [grid]);

  useEffect(() => {
    if (grid) return;
    const work = hero.current?.querySelector<HTMLElement>(".hero-work");
    const stage = hero.current?.querySelector<HTMLElement>(".scene-stage");
    if (!work || !stage) return;
    const card = hero.current?.querySelector<HTMLElement>(".hero-copy");
    function update() {
      // Clip the WebGL layer behind the card as well as stacking it below.
      // This prevents sticky canvas compositing from painting over the card.
      if (card) {
        const viewport = stage!.getBoundingClientRect();
        const panel = card.getBoundingClientRect();
        const x = Math.max(0, panel.left - viewport.left - 2);
        const y = Math.max(0, panel.top - viewport.top - 2);
        const right = Math.min(viewport.width, panel.right - viewport.left + 2);
        const bottom = Math.min(
          viewport.height,
          panel.bottom - viewport.top + 2,
        );
        stage!.style.clipPath =
          right > x && bottom > y
            ? `path(evenodd, "M0 0H${viewport.width}V${viewport.height}H0Z M${x} ${y}H${right}V${bottom}H${x}Z")`
            : "none";
      }
      scrollOffset.current = Math.max(
        0,
        Math.min(
          Math.max(0, work!.clientHeight - stage!.clientHeight),
          stage!.getBoundingClientRect().top -
            work!.getBoundingClientRect().top,
        ),
      );
      renderSceneRef.current?.();
    }
    const measure = () => {
      setDocumentHeight(work.clientHeight);
      const viewport = stage.getBoundingClientRect();
      setLeftInset(
        window.innerWidth >= 900 && card
          ? card.getBoundingClientRect().right -
              viewport.left +
              Math.max(16, viewport.width * 0.02)
          : 0,
      );
      if (card && window.innerWidth <= PHONE_MAX_WIDTH) {
        const panel = card.getBoundingClientRect();
        const left = Math.round(panel.left - viewport.left);
        const right = Math.round(panel.right - viewport.left);
        setPhoneEdges((previous) =>
          previous?.left === left && previous.right === right
            ? previous
            : { left, right },
        );
      } else {
        setPhoneEdges(null);
      }
      update();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(work);
    observer.observe(stage);
    if (card) observer.observe(card);
    // Scroll can fire several times per frame; read layout at most once per frame.
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      stage.style.clipPath = "none";
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measure);
    };
  }, [grid, sceneHeight]);

  return (
    <section
      ref={hero}
      className={`hero ${grid ? "hero-list" : ""}`}
      aria-labelledby="hero-title"
      style={{ "--signpost-height": `${sceneHeight}px` } as CSSProperties}
    >
      <div className="hero-intro-column">
        <div className="hero-copy neu-card">
          <p className="eyebrow">
            <span className="accent-line" aria-hidden="true" />{" "}
            {profile.role.toUpperCase()}
          </p>
          <p className="hero-hello">
            {siteCopy.hero.greeting} {profile.name}.
          </p>
          <h1 id="hero-title">
            <span className="sr-only">{profile.name}. </span>
            {siteCopy.hero.headline.map((line) => (
              <span className="headline-line" key={line}>
                {line}
              </span>
            ))}
            <em>{siteCopy.hero.emphasis}</em>
          </h1>
          <p className="hero-description">{siteCopy.hero.description}</p>
          <Link className="text-link" href="/about">
            {siteCopy.hero.aboutCta}{" "}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-bottom">
          <a href="#introduction" className="scroll-hint">
            <span className="scroll-icon">
              <ArrowDown size={15} aria-hidden="true" />
            </span>
            {grid ? siteCopy.hero.gridScrollHint : siteCopy.hero.scrollHint}
          </a>
        </div>
      </div>
      <div className="hero-work">
        <div className="scene-meta">
          {!grid && <span>{siteCopy.hero.collectionLabel}</span>}
          <span>
            {String(projects.length).padStart(2, "0")}{" "}
            {siteCopy.hero.projectLabel}
          </span>
        </div>
        <div className="scene-stage">
          {projects.length === 0 ? (
            <div className="scene-loading">{siteCopy.hero.empty}</div>
          ) : grid ? (
            <ProjectCarousel projects={projects} sample={sample} />
          ) : (
            <SignpostSceneClient
              projects={projects}
              rotation={rotation}
              sample={sample}
              renderSceneRef={renderSceneRef}
              scrollOffset={scrollOffset}
              onSceneHeight={setSceneHeight}
              documentHeight={documentHeight}
              leftInset={leftInset}
              phoneEdges={phoneEdges}
            />
          )}
        </div>
        {/* The list view drops the slogan, but keeps the sample-concepts notice. */}
        {(!grid || sample) && (
          <div className="scene-bottom">
            <span className="scene-instruction">
              {sample
                ? siteCopy.hero.sampleInstruction
                : siteCopy.hero.instruction}
            </span>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
