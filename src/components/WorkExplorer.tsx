"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { PostFolder } from "@/lib/photo-posts";
import { formatWritingDate, type Writing } from "@/lib/writing-file";

export type ExplorerPiece = Pick<Writing, "slug" | "title" | "date" | "type">;
type TabId = "photos" | "writing";

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

/**
 * The Work page's file-browser window: photo posts as folders on one tab,
 * writing as documents on the other. Under the pointer (or keyboard focus) a
 * folder's first photos pop out of it (CSS). Each item opens its own page.
 * A link to /#writing opens the writing tab.
 */
export function WorkExplorer({
  folders,
  pieces,
}: {
  folders: PostFolder[];
  pieces: ExplorerPiece[];
}) {
  const id = useId();
  const region = useRef<HTMLElement>(null);
  const tabList = useRef<HTMLDivElement>(null);
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );
  // The tab the visitor chose, and the address it was chosen under.
  const [picked, setPicked] = useState<{ tab: TabId; hash: string } | null>(
    null,
  );

  // A link to /#writing lands on the window once the page above it has its
  // final height (the browser's own jump happens before that).
  useEffect(() => {
    if (hash !== "#writing") return;
    const frame = requestAnimationFrame(() =>
      region.current?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  const tabs = (
    [
      { id: "photos", ...siteCopy.explorer.photos, count: folders.length },
      { id: "writing", ...siteCopy.explorer.writing, count: pieces.length },
    ] as const
  ).filter((tab) => tab.count > 0);
  if (tabs.length === 0) return null;

  // The visitor's own choice wins until the address changes (a link to
  // /#writing); otherwise the address decides.
  const wanted =
    picked && picked.hash === hash
      ? picked.tab
      : hash === "#writing"
        ? "writing"
        : "photos";
  const active = tabs.find((tab) => tab.id === wanted) ?? tabs[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active.id);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setPicked({ tab: next.id, hash });
    tabList.current
      ?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)
      ?.focus();
  }

  const { handle, url } = profile.photography;
  return (
    <section
      ref={region}
      id="photos"
      className="photo-scene"
      aria-labelledby={`${id}-title`}
    >
      {/* Where a link to /#writing lands. */}
      <span id="writing" className="finder-anchor" />
      <div className="finder neu-card">
        <header className="finder-bar">
          {/* Window dressing only: there is nowhere to go back to. */}
          <span className="finder-nav" aria-hidden="true">
            <ChevronLeft size={18} />
            <ChevronRight size={18} />
          </span>
          <h2 id={`${id}-title`} className="finder-title">
            {active.windowTitle}
          </h2>
          {active.id === "photos" && (
            <a
              className="text-link finder-account"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{handle} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
        </header>
        {tabs.length > 1 && (
          <div
            ref={tabList}
            className="finder-tabs"
            role="tablist"
            aria-label={siteCopy.explorer.tabsLabel}
            onKeyDown={onTabKeyDown}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className="finder-tab"
                id={`${id}-tab-${tab.id}`}
                data-tab={tab.id}
                aria-selected={tab.id === active.id}
                aria-controls={`${id}-panel-${tab.id}`}
                tabIndex={tab.id === active.id ? 0 : -1}
                onClick={() => setPicked({ tab: tab.id, hash })}
              >
                {tab.tab}
              </button>
            ))}
          </div>
        )}
        {folders.length > 0 && (
          <div
            role="tabpanel"
            id={`${id}-panel-photos`}
            aria-labelledby={
              tabs.length > 1 ? `${id}-tab-photos` : `${id}-title`
            }
            hidden={active.id !== "photos"}
          >
            <ul className="finder-grid">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <Link className="finder-item" href={folder.href}>
                    {/* Back of the folder, the photos inside it, then its
                        front, so the photos rise out from between the two. */}
                    <span className="finder-folder" aria-hidden="true">
                      <span className="finder-folder-back" />
                      {folder.previews.map((src, index) => (
                        // Plain images: the files are already sized by
                        // scripts/add-photos.mjs. The cover comes up in the
                        // middle, the next photo on the left, the third on
                        // the right.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          className="finder-preview"
                          data-place={["middle", "left", "right"][index]}
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      ))}
                      <span className="finder-folder-front" />
                    </span>
                    <span className="finder-label">{folder.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {pieces.length > 0 && (
          <div
            role="tabpanel"
            id={`${id}-panel-writing`}
            aria-labelledby={
              tabs.length > 1 ? `${id}-tab-writing` : `${id}-title`
            }
            hidden={active.id !== "writing"}
          >
            <ul className="finder-grid">
              {pieces.map((piece) => (
                <li key={piece.slug}>
                  <Link className="finder-item" href={`/writing/${piece.slug}`}>
                    {/* The sheet sits in a box the size of a folder, so both
                        tabs line up. */}
                    <span className="finder-doc-box" aria-hidden="true">
                      <span className="finder-doc" />
                    </span>
                    <span className="finder-label">{piece.title}</span>
                    <span className="finder-sublabel">
                      {piece.type}
                      {piece.date && (
                        <>
                          {" · "}
                          <time dateTime={piece.date}>
                            {formatWritingDate(piece.date)}
                          </time>
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
