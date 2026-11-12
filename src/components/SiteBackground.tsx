"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

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

// One shader gradient behind every page. It lives in the root layout, so it is
// created once and kept while visitors move between pages. The themed CSS
// gradient on `.site-background` shows first and stays if WebGL is missing;
// the shader code is only fetched once the browser is idle, so it never
// competes with the page's own content. (ShaderBackground draws a still frame
// instead of an animation when the visitor asks for less motion.)
export function SiteBackground() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 2000,
      });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="site-background" aria-hidden="true">
      {ready && (
        <BackgroundBoundary>
          <Gradient />
        </BackgroundBoundary>
      )}
    </div>
  );
}
