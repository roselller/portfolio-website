"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Component, type ReactNode } from "react";

const Gradient = dynamic(() => import("./ShaderBackground"), { ssr: false });

class BackgroundBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// The animated shader only runs on the home page. Every other page keeps the
// themed CSS gradient behind `.site-background`, and never downloads the 3D code.
export function SiteBackground() {
  const animated = usePathname() === "/";
  return (
    <div className="site-background" aria-hidden="true">
      {animated && (
        <BackgroundBoundary>
          <Gradient />
        </BackgroundBoundary>
      )}
    </div>
  );
}
