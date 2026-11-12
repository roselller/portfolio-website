"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Box, List } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import { GlassPanel } from "./ui/GlassPanel";
import { useProjectView } from "./ProjectViewProvider";
import { ThemeToggle } from "./ThemeToggle";

// The header renders this twice: beside the theme switch on wide screens and on
// a row of its own on narrow ones (CSS shows one). That keeps the tab order the
// same as the visual order at every width.
function ProjectViewSwitch({ className }: { className: string }) {
  const { grid, reduced, setList } = useProjectView();
  return (
    <div
      className={`view-toggle project-view-toggle ${className}`}
      role="group"
      aria-label="Project view"
    >
      <button
        type="button"
        aria-label="3D view"
        aria-pressed={!grid}
        disabled={reduced}
        onClick={() => setList(false)}
      >
        <Box size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={grid}
        onClick={() => setList(true)}
      >
        <List size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

// How long the active pill takes to slide from one link to the next.
const PILL_SLIDE_MS = 380;

function isActive(href: string, pathname: string) {
  return (
    pathname === href ||
    (href === "/" &&
      ["/projects/", "/writing/", "/photos/"].some((section) =>
        pathname.startsWith(section),
      ))
  );
}

export function Navbar() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  // The link the pill was on before this page.
  const previousHref = useRef<string | undefined>(undefined);
  const activeHref = siteCopy.navigation.find(({ href }) =>
    isActive(href, pathname),
  )?.href;

  // The pill slides from the link it was on to the new one. Both places are
  // measured now and inside the nav (offsetLeft), never against the page: a
  // page change also resets the scroll, and a slide measured against the page
  // started a scroll's distance below the bar. Measuring now (not when the old
  // page was shown) keeps the start right after a resize or a late font swap.
  useLayoutEffect(() => {
    const from = previousHref.current;
    previousHref.current = activeHref;
    if (!activeHref || !from || from === activeHref || reduced) return;
    const links = nav.current?.querySelectorAll<HTMLElement>("a");
    const index = (href: string) =>
      siteCopy.navigation.findIndex((item) => item.href === href);
    const link = links?.[index(activeHref)];
    const old = links?.[index(from)];
    const pill = link?.querySelector<HTMLElement>(".nav-active-indicator");
    if (!link || !old || !pill) return;
    const left = old.offsetLeft - link.offsetLeft;
    const right =
      link.offsetLeft + link.offsetWidth - old.offsetLeft - old.offsetWidth;
    pill.animate(
      [
        { left: `${left}px`, right: `${right}px` },
        { left: "0px", right: "0px" },
      ],
      { duration: PILL_SLIDE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [activeHref, reduced]);

  return (
    <header className="site-header neu-card">
      <Link href="/" className="wordmark" aria-label={`${profile.name}, home`}>
        {profile.initials}
        <span aria-hidden="true">.</span>
      </Link>
      <GlassPanel className="nav-shell">
        <nav ref={nav} className="main-nav" aria-label="Main navigation">
          {siteCopy.navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, pathname) ? "page" : undefined}
            >
              {isActive(href, pathname) && (
                <span className="nav-active-indicator" aria-hidden="true" />
              )}
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </GlassPanel>
      <div className="header-actions">
        {pathname === "/" && (
          <ProjectViewSwitch className="project-view-inline" />
        )}
        <ThemeToggle />
        <Link className="text-link header-cta" href="/contact">
          {siteCopy.contactCta} <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {pathname === "/" && <ProjectViewSwitch className="project-view-row" />}
    </header>
  );
}
