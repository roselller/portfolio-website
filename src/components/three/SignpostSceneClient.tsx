"use client";

import dynamic from "next/dynamic";
import { Suspense, type RefObject } from "react";
import type { Project } from "@/data/projects";

function SceneLoading() {
  return (
    <div className="scene-loading" role="status">
      <span className="loading-ring" />
      Finding a direction…
    </div>
  );
}

const Scene = dynamic(() => import("./SignpostScene"), {
  ssr: false,
  loading: SceneLoading,
});

export function SignpostSceneClient({
  projects,
  rotation,
  sample,
  renderSceneRef,
  scrollOffset,
  onSceneHeight,
  documentHeight,
  leftInset,
}: {
  projects: Project[];
  rotation: RefObject<number>;
  sample: boolean;
  renderSceneRef: RefObject<(() => void) | null>;
  scrollOffset: RefObject<number>;
  onSceneHeight: (height: number) => void;
  documentHeight: number;
  leftInset: number;
}) {
  return (
    <Suspense fallback={<SceneLoading />}>
      <Scene
        projects={projects}
        rotation={rotation}
        sample={sample}
        renderSceneRef={renderSceneRef}
        scrollOffset={scrollOffset}
        onSceneHeight={onSceneHeight}
        documentHeight={documentHeight}
        leftInset={leftInset}
      />
    </Suspense>
  );
}
