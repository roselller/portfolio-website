"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PCFShadowMap, Euler, Vector3, type Group } from "three";
import { OrthographicCamera } from "@react-three/drei";
import { SignHoverFx } from "@/lib/sign-hover-fx";
import { Pole } from "./Pole";
import { SignArm } from "./SignArm";
import { ProjectGrid } from "@/components/ProjectGrid";
import type { Project } from "@/data/projects";
import { getSignpostLayout } from "@/lib/signpost-layout";
import { useSignpostTheme } from "./SignpostParts";
import { fitSignpostBoards, getSignpostPlacement } from "@/lib/signpost-fit";

const REST_OFFSET = -Math.PI / 10;

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Assembly({
  projects,
  rotation,
  scrollOffset,
  onSceneHeight,
  documentHeight,
  leftInset,
  phoneEdges,
  fx,
}: {
  projects: Project[];
  rotation: RefObject<number>;
  scrollOffset: RefObject<number>;
  onSceneHeight: (height: number) => void;
  documentHeight: number;
  leftInset: number;
  phoneEdges: { left: number; right: number } | null;
  fx: RefObject<SignHoverFx | null>;
}) {
  const assembly = useRef<Group>(null);
  const position = useRef<Group>(null);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const getState = useThree((state) => state.get);
  const lastScroll = useRef(0);
  const lookAgain = useRef(false);
  const theme = useSignpostTheme();
  const layout = useMemo(() => getSignpostLayout(projects), [projects]);
  const lean = size.width >= 900 ? 0.1 : 0.08;
  const pitch = -Math.PI / 16; // Lean away from the viewer by 11.25 degrees.
  // Phones scale the signpost to the card width; other widths are unchanged.
  const placement = useMemo(
    () =>
      getSignpostPlacement(
        layout,
        size.width,
        size.height,
        phoneEdges,
        [pitch, -0.16, -lean],
        REST_OFFSET,
      ),
    [layout, size.width, size.height, phoneEdges, pitch, lean],
  );
  const presentation = placement;
  const up = useMemo(
    () => new Vector3(0, 1, 0).applyEuler(new Euler(pitch, -0.16, -lean)),
    [pitch, lean],
  );
  const vertical = up.y;
  const extension = Math.max(
    0,
    (documentHeight - 64) / (presentation.pixelsPerUnit * vertical) -
      layout.height,
  );
  const boards = useMemo(
    () =>
      fitSignpostBoards(layout, {
        width: size.width,
        height: size.height,
        documentHeight,
        leftInset: placement.leftEdge ?? leftInset,
        rightEdge: placement.rightEdge,
        restOnly: placement.restOnly,
        pixelsPerUnit: placement.pixelsPerUnit,
        topX: placement.topX,
        rotation: [pitch, -0.16, -lean],
        restOffset: REST_OFFSET,
      }).map((board) => ({
        ...board,
        // Lift the complete stack to the top instead of spreading the pole
        // extension between signs. Their authored gaps stay compact.
        height: board.height + extension,
      })),
    [
      layout,
      extension,
      size.width,
      size.height,
      documentHeight,
      leftInset,
      placement,
      pitch,
      lean,
    ],
  );
  useEffect(() => {
    onSceneHeight(presentation.contentHeight);
    invalidate();
  }, [
    presentation.pixelsPerUnit,
    presentation.contentHeight,
    onSceneHeight,
    invalidate,
    theme,
    extension,
  ]);
  useFrame(() => {
    if (assembly.current)
      assembly.current.rotation.y = rotation.current + REST_OFFSET;
    if (position.current) {
      position.current.position.x =
        (placement.topX - size.width / 2) / presentation.pixelsPerUnit -
        (layout.height + extension) * up.x +
        (scrollOffset.current / presentation.pixelsPerUnit) * (up.x / up.y);
      position.current.position.y =
        (size.height / 2 - 32 + scrollOffset.current) /
          presentation.pixelsPerUnit -
        (layout.height + extension) * vertical;
      position.current.position.z =
        -(layout.height + extension) * up.z +
        (scrollOffset.current / presentation.pixelsPerUnit) * (up.z / up.y);
    }
    // Scrolling moves the signs under a pointer that stays still, and the scene
    // only looks for what is under the pointer when the pointer moves. So after
    // the last scroll step has been drawn, ask it to look once more; otherwise
    // the hover (and its glow) would stay on a sign that has moved away.
    if (scrollOffset.current !== lastScroll.current) {
      lastScroll.current = scrollOffset.current;
      lookAgain.current = true;
      invalidate();
    } else if (lookAgain.current) {
      lookAgain.current = false;
      getState().events.update?.();
    }
  });
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 20]}
        zoom={presentation.pixelsPerUnit}
        near={0.1}
        far={100}
      />
      <group ref={position} rotation={[pitch, -0.16, -lean]}>
        <group ref={assembly}>
          <group>
            <Pole top={layout.poleTop + extension} />
            {boards.map((board) => (
              <SignArm
                key={board.project.slug}
                board={board}
                theme={theme}
                fx={fx}
              />
            ))}
          </group>
        </group>
      </group>
    </>
  );
}

export default function SignpostScene({
  projects,
  rotation,
  sample,
  renderSceneRef,
  scrollOffset,
  onSceneHeight,
  documentHeight,
  leftInset,
  phoneEdges,
}: {
  projects: Project[];
  rotation: RefObject<number>;
  sample: boolean;
  renderSceneRef: RefObject<(() => void) | null>;
  scrollOffset: RefObject<number>;
  onSceneHeight: (height: number) => void;
  documentHeight: number;
  leftInset: number;
  phoneEdges: { left: number; right: number } | null;
}) {
  const fallback = (
    <div className="scene-fallback">
      <p className="eyebrow">Pick a project to explore</p>
      <ProjectGrid projects={projects} sample={sample} />
    </div>
  );
  // The glow and characters of a hovered sign are drawn on a 2D canvas under
  // the WebGL canvas (see SignHoverFx).
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<SignHoverFx | null>(null);
  useEffect(() => {
    const canvas = fxCanvas.current;
    if (!canvas) return;
    const effects = new SignHoverFx(canvas);
    fx.current = effects;
    return () => {
      effects.dispose();
      fx.current = null;
    };
  }, []);
  return (
    <SceneBoundary fallback={fallback}>
      <canvas ref={fxCanvas} className="sign-fx" aria-hidden="true" />
      <Canvas
        shadows={{ type: PCFShadowMap }}
        frameloop="demand"
        dpr={[1, 1.5]}
        orthographic
        camera={{ position: [0, 0, 20], zoom: 100, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        fallback={fallback}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor("#0b0c0e", 0);
          renderSceneRef.current = invalidate;
        }}
      >
        <ambientLight intensity={1.2} />
        <hemisphereLight args={["#fafaf4", "#363b40", 1.6]} />
        <directionalLight
          position={[-4, 7, 6]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.001}
        />
        <directionalLight position={[5, 3, 3]} intensity={1} color="#f0f2f3" />
        <Suspense fallback={null}>
          <Assembly
            projects={projects}
            rotation={rotation}
            scrollOffset={scrollOffset}
            onSceneHeight={onSceneHeight}
            documentHeight={documentHeight}
            leftInset={leftInset}
            phoneEdges={phoneEdges}
            fx={fx}
          />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
