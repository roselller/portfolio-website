"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { Photo } from "@/lib/instagram";
import {
  keyMove,
  parkedOffset,
  slideOffset,
  slideState,
  stepIndex,
  swipeStep,
} from "@/lib/carousel";
import { useInView } from "@/lib/use-in-view";

// A click that lands right after a swipe is the swipe's own, not a tap.
const SWIPE_CLICK_GUARD_MS = 350;

/** The cover, with the post's next photos stacked behind it (they fan out
    under the pointer, in CSS). The last one is drawn first, so it lies at the
    bottom. Instagram's addresses are signed and change, so these are plain
    images, not next/image. */
function PrintImages({ photo, fan }: { photo: Photo; fan: boolean }) {
  return (
    <>
      {fan &&
        photo.fan
          .slice(0, 2)
          .map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              className="photo-fan"
              data-fan={index + 1}
              src={src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ))
          .reverse()}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="photo-face"
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
      />
    </>
  );
}

/**
 * Scene two of the Work page: photo posts on a loop. The latest starts in the
 * middle with the one before it on the right and the oldest on the left; a
 * click on a side post (or a swipe, the arrow keys, the dots) turns the loop.
 * The post in the middle fans its next photos out under the pointer and opens
 * its own page. The prints jiggle slowly while the scene is on screen (CSS;
 * never with reduced motion).
 */
export function PhotoScene({ photos }: { photos: Photo[] }) {
  const region = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const justSwiped = useRef(false);
  const revealed = useInView(region, { threshold: 0.25, once: true });
  const onScreen = useInView(region, { threshold: 0.05 });

  const count = photos.length;
  if (count === 0) return null;
  const current = stepIndex(active, 0, count);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const move = keyMove(event.key);
    if (!move || count < 2) return;
    event.preventDefault();
    setActive(
      "step" in move
        ? stepIndex(current, move.step, count)
        : move.to === "first"
          ? 0
          : count - 1,
    );
  }
  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // Mouse users click the side posts; dragging is for fingers and pens.
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || count < 2) return;
    const step = swipeStep(event.clientX - start.x, event.clientY - start.y);
    if (!step) return;
    setActive(stepIndex(current, step, count));
    justSwiped.current = true;
    window.setTimeout(() => {
      justSwiped.current = false;
    }, SWIPE_CLICK_GUARD_MS);
  }

  const { handle, url } = profile.photography;
  return (
    <section
      ref={region}
      id="photos"
      className="work-scene photo-scene"
      aria-roledescription="carousel"
      aria-label={siteCopy.photos.label}
      data-revealed={revealed ? "" : undefined}
      data-onscreen={onScreen ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <header className="work-scene-header">
        <h2 className="eyebrow">
          <span className="accent-line" aria-hidden="true" />{" "}
          {siteCopy.photos.eyebrow}
        </h2>
        <a
          className="text-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{handle} <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>
      <div
        className="photo-track"
        aria-live="polite"
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
        {photos.map((photo, index) => {
          const offset = slideOffset(index, current, count);
          const state = slideState(offset);
          const label = `${index + 1} of ${count}`;
          return (
            <div
              key={photo.id}
              className="photo-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={label}
              aria-hidden={state === "active" ? undefined : true}
              inert={state === "hidden"}
              data-state={state}
              data-side={
                state === "active" ? undefined : offset < 0 ? "left" : "right"
              }
              style={{ "--offset": parkedOffset(offset) } as CSSProperties}
            >
              {state !== "active" ? (
                // Side posts are for the pointer; keyboard and screen reader
                // users turn the loop with the arrow keys and the dots.
                <button
                  type="button"
                  className="photo-print"
                  tabIndex={-1}
                  onClick={() => setActive(index)}
                >
                  <PrintImages photo={photo} fan={false} />
                </button>
              ) : photo.href?.startsWith("/") ? (
                <Link className="photo-print" href={photo.href}>
                  <PrintImages photo={photo} fan />
                  <span className="sr-only"> (open this post)</span>
                </Link>
              ) : photo.href ? (
                <a
                  className="photo-print"
                  href={photo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PrintImages photo={photo} fan />
                  <span className="sr-only"> (opens Instagram)</span>
                </a>
              ) : (
                <div className="photo-print">
                  <PrintImages photo={photo} fan />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div className="carousel-dots" role="group" aria-label="Choose a post">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className="carousel-dot"
              aria-label={`Show post ${index + 1} of ${count}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
