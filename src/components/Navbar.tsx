"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Box, List } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import { GlassPanel } from "./ui/GlassPanel";
import { useProjectView } from "./ProjectViewProvider";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const { grid, reduced: reducedView, setList } = useProjectView();
  const reduced = useReducedMotion();
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label={`${profile.name}, home`}>
        {profile.initials}
        <span aria-hidden="true">.</span>
      </Link>
      <GlassPanel className="nav-shell">
        <nav className="main-nav" aria-label="Main navigation">
          {siteCopy.navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href ||
                (href === "/" && pathname.startsWith("/projects/"))
                  ? "page"
                  : undefined
              }
            >
              {(pathname === href ||
                (href === "/" && pathname.startsWith("/projects/"))) && (
                <motion.span
                  className="nav-active-indicator"
                  layoutId="main-navigation-active"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                  aria-hidden="true"
                />
              )}
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </GlassPanel>
      <div className="header-actions">
        {pathname === "/" && (
          <div
            className="view-toggle project-view-toggle"
            role="group"
            aria-label="Project view"
          >
            <button
              type="button"
              aria-label="3D view"
              aria-pressed={!grid}
              disabled={reducedView}
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
        )}
        <ThemeToggle />
        <Link className="text-link header-cta" href="/contact">
          {siteCopy.contactCta} <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
