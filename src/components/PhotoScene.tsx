import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import type { PostFolder } from "@/lib/photo-posts";

/**
 * Scene two of the Work page: the photo posts as folders in a file-browser
 * window. Under the pointer (or keyboard focus) a folder's first photos pop
 * out of it (CSS); a click opens the post's own page.
 */
export function PhotoScene({ folders }: { folders: PostFolder[] }) {
  if (folders.length === 0) return null;
  const { handle, url } = profile.photography;
  return (
    <section id="photos" className="photo-scene" aria-labelledby="photos-title">
      <div className="finder neu-card">
        <header className="finder-bar">
          {/* Window dressing only: there is nowhere to go back to. */}
          <span className="finder-nav" aria-hidden="true">
            <ChevronLeft size={18} />
            <ChevronRight size={18} />
          </span>
          <h2 id="photos-title" className="finder-title">
            <span className="sr-only">{siteCopy.photos.label}: </span>
            {siteCopy.photos.windowTitle}
          </h2>
          <a
            className="text-link finder-account"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{handle} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </header>
        <ul className="finder-grid">
          {folders.map((folder) => (
            <li key={folder.id}>
              <Link className="finder-item" href={folder.href}>
                {/* Back of the folder, the photos inside it, then its front,
                    so the photos rise out from between the two. */}
                <span className="finder-folder" aria-hidden="true">
                  <span className="finder-folder-back" />
                  {folder.previews.map((preview, index) => (
                    // Plain images: the files are already sized by
                    // scripts/add-photos.mjs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={preview.src}
                      className="finder-preview"
                      data-preview={index + 1}
                      src={preview.src}
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
    </section>
  );
}
