"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteCopy } from "@/data/site-copy";
import { formatWritingDate, type Writing } from "@/lib/writing-file";
import { useInView } from "@/lib/use-in-view";

// Tabs step from left to right and start again after this many folders.
const TAB_POSITIONS = 4;

export type FolderPiece = Pick<
  Writing,
  "slug" | "title" | "date" | "type" | "summary"
>;

/**
 * Scene three of the Work page: one folder per piece of writing, the newest
 * in front, each one behind standing a little higher with its tab further to
 * the right. The tab carries the title; a folder rises under the pointer or
 * keyboard focus and opens the piece's page. The folders come up front to
 * back the first time the scene scrolls into view (CSS, off with reduced
 * motion).
 */
export function WritingFolders({ pieces }: { pieces: FolderPiece[] }) {
  const region = useRef<HTMLElement>(null);
  const revealed = useInView(region, { threshold: 0.3, once: true });
  if (pieces.length === 0) return null;
  return (
    <section
      ref={region}
      id="writing"
      className="work-scene writing-scene"
      aria-labelledby="writing-heading"
      data-revealed={revealed ? "" : undefined}
    >
      <header className="work-scene-header">
        <h2 id="writing-heading" className="eyebrow">
          <span className="accent-line" aria-hidden="true" />{" "}
          {siteCopy.writing.eyebrow}
        </h2>
        <span className="work-scene-count">
          {String(pieces.length).padStart(2, "0")}{" "}
          {pieces.length === 1
            ? siteCopy.writing.countOne
            : siteCopy.writing.countMany}
        </span>
      </header>
      <ol
        className="folder-stack"
        style={{ "--folders": pieces.length } as CSSProperties}
      >
        {pieces.map((piece, index) => (
          <li
            key={piece.slug}
            className="folder"
            data-first-tab={index % TAB_POSITIONS === 0 ? "" : undefined}
            style={
              {
                "--i": index,
                "--tab": index % TAB_POSITIONS,
              } as CSSProperties
            }
          >
            <Link href={`/writing/${piece.slug}`} className="folder-link">
              <span className="folder-tab">
                <span className="folder-tab-title">{piece.title}</span>
              </span>
              <span className="folder-body">
                <span className="folder-meta">
                  {piece.type.toUpperCase()}
                  {piece.date && (
                    <>
                      {" · "}
                      <time dateTime={piece.date}>
                        {formatWritingDate(piece.date)}
                      </time>
                    </>
                  )}
                </span>
                {/* Only the front folder's face is in view; the tab already
                    says the title, so this copy is for the eye alone. */}
                {index === 0 && (
                  <>
                    <span className="folder-title" aria-hidden="true">
                      {piece.title}
                    </span>
                    {piece.summary && (
                      <span className="folder-summary">{piece.summary}</span>
                    )}
                    <span className="folder-read">
                      {siteCopy.writing.read}{" "}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                  </>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
