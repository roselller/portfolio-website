"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { SignpostSceneClient } from "./three/SignpostSceneClient";
import { ProjectCarousel } from "./ProjectCarousel";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { Project } from "@/data/projects";

import { useProjectView } from "./ProjectViewProvider";
import { bindSignpostPointer } from "@/lib/signpost-pointer";
import { createQuickTween } from "@/lib/quick-tween";

export function SignpostHero({
  projects,
  sample,
}: {
  projects: Project[];
  sample: boolean;
}) {
  const hero = useRef<HTMLElement>(null);
  const rotation = useRef(0);
  const scrollOffset = useRef(0);
  const [sceneHeight, setSceneHeight] = useState(1400);
  const [documentHeight, setDocumentHeight] = useState(0);
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

  useEffect(() => {
    if (grid) return;
    const work = hero.current?.querySelector<HTMLElement>(".hero-work");
    const stage = hero.current?.querySelector<HTMLElement>(".scene-stage");
    if (!work || !stage) return;
    function update() {
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
      update();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(work);
    observer.observe(stage);
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
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measure);
    };
  }, [grid, sceneHeight]);

  const meta = (
    <div className="scene-meta">
      <span>
        {String(projects.length).padStart(2, "0")} {siteCopy.hero.projectLabel}
      </span>
      <a
        className="scene-meta-link"
        href={profile.github}
        target="_blank"
        rel="noopener noreferrer"
      >
        {siteCopy.hero.githubCta} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </div>
  );

  return (
    <section
      ref={hero}
      className={`hero ${grid ? "hero-list" : ""}`}
      aria-labelledby="hero-title"
      style={{ "--signpost-height": `${sceneHeight}px` } as CSSProperties}
    >
      {/* No intro card in either view: the signpost or the project cards are
          the hero, and the page's heading is kept for screen readers and
          search engines. */}
      <h1 id="hero-title" className="sr-only">
        {profile.name}. {siteCopy.hero.headline.join(" ")}{" "}
        {siteCopy.hero.emphasis}
      </h1>
      {/* The project count on the left, a link to GitHub on the right. Card
          mode keeps it above the cards; the 3D view above the signpost. */}
      {!grid && meta}
      <div className="hero-work">
        {grid && meta}
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
    </section>
  );
}
