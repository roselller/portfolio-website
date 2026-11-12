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
// gradient on `.site-background` shows first and stays if WebGL is missing or
// the visitor asked for less data (Save-Data): then the shader code is never
// fetched. The shader code is otherwise fetched once the browser is idle, so
// it never competes with the page's own content, and the shader fades in when
// its first frame is drawn. (ShaderBackground draws a still frame instead of
// an animation when the visitor asks for reduced motion.)
export function SiteBackground() {
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
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
    <div
      className="site-background"
      data-shader={drawn ? "on" : "off"}
      aria-hidden="true"
    >
      {ready && (
        <BackgroundBoundary>
          <Gradient onFrame={() => setDrawn(true)} />
        </BackgroundBoundary>
      )}
    </div>
  );
}
