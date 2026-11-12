"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { Photo } from "@/lib/instagram";
import { keyMove, stepIndex, swipeStep } from "@/lib/carousel";
import {
  PHOTOS_PER_PAGE,
  PHOTOS_PER_PAGE_PHONE,
  pageForItem,
  toPages,
} from "@/lib/photo-pages";
import { PHONE_MAX_WIDTH } from "@/lib/signpost-layout";
import { useInView } from "@/lib/use-in-view";

const PHONE = `(max-width: ${PHONE_MAX_WIDTH}px)`;
// A click that lands right after a swipe is the swipe's own, not a tap.
const SWIPE_CLICK_GUARD_MS = 350;

function subscribeToPhone(callback: () => void) {
  const media = window.matchMedia(PHONE);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * Scene two of the Work page: photos from the photography account, three to
 * a page (one on phones), turned with the arrows, a swipe, the arrow keys or
 * the dots. The prints jiggle slowly while the scene is on screen (CSS; never
 * with reduced motion) and hold still under the pointer.
 */
export function PhotoScene({ photos }: { photos: Photo[] }) {
  const region = useRef<HTMLElement>(null);
  const phone = useSyncExternalStore(
    subscribeToPhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
  const perPage = phone ? PHOTOS_PER_PAGE_PHONE : PHOTOS_PER_PAGE;
  // The first photo on screen is what is remembered, so it stays on screen
  // when the page size changes.
  const [firstItem, setFirstItem] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const justSwiped = useRef(false);
  const revealed = useInView(region, { threshold: 0.25, once: true });
  const onScreen = useInView(region, { threshold: 0.05 });

  const pages = toPages(photos, perPage);
  const count = pages.length;
  const current = pageForItem(firstItem, perPage, photos.length);

  if (photos.length === 0) return null;

  const goTo = (page: number) => setFirstItem(page * perPage);
  const stepBy = (step: number) => goTo(stepIndex(current, step, count));

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const move = keyMove(event.key);
    if (!move || count < 2) return;
    event.preventDefault();
    goTo(
      "step" in move
        ? stepIndex(current, move.step, count)
        : move.to === "first"
          ? 0
          : count - 1,
    );
  }
  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // Mouse users have the arrows; dragging is for fingers and pens.
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || count < 2) return;
    const step = swipeStep(event.clientX - start.x, event.clientY - start.y);
    if (!step) return;
    stepBy(step);
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
      <div className="photo-stage">
        {count > 1 && (
          <button
            type="button"
            className="photo-arrow photo-arrow-previous"
            aria-label="Previous photos"
            onClick={() => stepBy(-1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <div
          className="photo-viewport"
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
          <div
            className="photo-track"
            style={{ "--page": current } as CSSProperties}
          >
            {pages.map((page, pageIndex) => (
              <div
                key={page[0].id}
                className="photo-page"
                role="group"
                aria-roledescription="slide"
                aria-label={`${pageIndex + 1} of ${count}`}
                aria-hidden={pageIndex === current ? undefined : true}
                inert={pageIndex !== current}
                data-current={pageIndex === current ? "" : undefined}
              >
                {page.map((photo, slot) => {
                  const image = (
                    // Instagram's addresses are signed and change, so these
                    // are plain images, not next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  );
                  return (
                    <div
                      key={photo.id}
                      className="photo-slot"
                      style={{ "--slot": slot } as CSSProperties}
                    >
                      {photo.href ? (
                        <a
                          className="photo-print"
                          href={photo.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {image}
                          <span className="sr-only"> (opens Instagram)</span>
                        </a>
                      ) : (
                        <div className="photo-print">{image}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {count > 1 && (
          <button
            type="button"
            className="photo-arrow photo-arrow-next"
            aria-label="Next photos"
            onClick={() => stepBy(1)}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {count > 1 && (
        <div className="carousel-dots" role="group" aria-label="Choose photos">
          {pages.map((page, pageIndex) => (
            <button
              key={page[0].id}
              type="button"
              className="carousel-dot"
              aria-label={`Show photos ${pageIndex + 1} of ${count}`}
              aria-current={pageIndex === current ? "true" : undefined}
              onClick={() => goTo(pageIndex)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
