"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ButtonAscii } from "./ButtonAscii";

// One button look for the whole site. The hover glow, lift and ASCII burst live
// in CSS (`.button` in globals.css) and ButtonAscii, so every element below
// behaves the same. Pick by what the button does:
//   ButtonLink   - navigates inside the site
//   ButtonAnchor - external link (pass target and rel yourself)
//   Button       - runs an action or submits a form

export function ButtonLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={cn("button", className)} {...props}>
      <ButtonAscii />
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  className,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a className={cn("button", className)} {...props}>
      <ButtonAscii />
      {children}
    </a>
  );
}

export function Button({
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button type={type} className={cn("button", className)} {...props}>
      <ButtonAscii />
      {children}
    </button>
  );
}
