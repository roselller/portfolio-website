"use client";

import dynamic from "next/dynamic";
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

export function SiteBackground() {
  return (
    <div className="site-background" aria-hidden="true">
      <BackgroundBoundary>
        <Gradient />
      </BackgroundBoundary>
    </div>
  );
}
