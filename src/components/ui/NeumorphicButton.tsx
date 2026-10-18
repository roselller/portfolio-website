"use client";

import { m, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const MotionLink = m.create(Link);

export function NeumorphicLink({
  className,
  children,
  variant = "solid",
  ...props
}: ComponentProps<typeof MotionLink> & { variant?: "solid" | "outline" }) {
  const reduced = useReducedMotion();
  return (
    <MotionLink
      className={cn("button", `button-${variant}`, className)}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      {...props}
    >
      {children}
    </MotionLink>
  );
}

export function NeumorphicButton({
  className,
  children,
  ...props
}: HTMLMotionProps<"button">) {
  const reduced = useReducedMotion();
  return (
    <m.button
      className={cn("button button-solid", className)}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      {...props}
    >
      {children}
    </m.button>
  );
}
