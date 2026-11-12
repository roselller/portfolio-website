"use client";

import type { ReactNode } from "react";
import { useProjectView } from "./ProjectViewProvider";

/**
 * Shows its children in card mode only. The Work page's context card lives
 * under the pole in the 3D view (SignpostHero) and closes the page in card
 * mode; it is rendered in one of the two places, never both.
 */
export function CardModeOnly({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { grid } = useProjectView();
  return grid ? <div className={className}>{children}</div> : null;
}
