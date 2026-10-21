"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Text, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import type { Group, Mesh } from "three";
import { HOVER_LIFT_PX, HOVER_POP } from "@/lib/hover-effect";
import { SignHoverFx } from "@/lib/sign-hover-fx";
import {
  BOARD_TEMPLATE_CENTER,
  type SignboardLayout,
  type SignpostTheme,
} from "@/lib/signpost-layout";
import { useSignpostParts } from "./SignpostParts";
import { boardCenter, projectedOutline } from "./sign-outline";

// How quickly the lift and pop follow the pointer, per second (about .3s, like .button).
const HOVER_RATE = 14;

export function SignArm({
  board,
  theme,
  fx,
}: {
  board: SignboardLayout;
  theme: SignpostTheme;
  fx: RefObject<SignHoverFx | null>;
}) {
  const parts = useSignpostParts();
  const router = useRouter();
  const group = useRef<Group>(null);
  const pop = useRef<Group>(null);
  const boardMesh = useRef<Mesh>(null);
  const lift = useRef(0);
  // "fx" is a mouse over a sign: it gets the button hover (lift, pop, glow,
  // characters) on top of the slide-out. Touch only gets the slide-out.
  const [hover, setHover] = useState<null | "fx" | "plain">(null);
  const active = hover !== null;
  const fxActive = hover === "fx";
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  useCursor(active);
  const slug = board.project.slug;
  // The board is scaled along x and mirrored; the pop grows it from its middle.
  const pivot = useMemo(() => {
    const center = boardCenter(parts.board.geometry);
    return [board.direction * board.scaleX * center.x, center.y, center.z] as [
      number,
      number,
      number,
    ];
  }, [parts.board.geometry, board.direction, board.scaleX]);
  const outline = useCallback(() => {
    const mesh = boardMesh.current;
    if (!mesh) return null;
    const { camera, size } = get();
    return projectedOutline(mesh, camera, size);
  }, [get]);

  // The glow and characters live on a 2D canvas behind the scene. Driven from
  // the settled hover state, so a pointer crossing from the board onto its text
  // (an out then an over) neither restarts nor drops the effect.
  useEffect(() => {
    if (!fxActive) return;
    const effects = fx.current;
    effects?.enter(slug, outline);
    return () => effects?.leave(slug);
  }, [fxActive, fx, slug, outline]);

  // Geometry is shared across projects; only small material instances differ.
  const materials = useMemo(() => {
    const original = Array.isArray(parts.board.material)
      ? parts.board.material
      : [parts.board.material];
    return original.map((source) => {
      const material = source.clone();
      if (source.name.startsWith("Surface")) material.color.set(theme.board);
      if (source.name.startsWith("Board ink")) material.color.set(theme.ink);
      if (source.name.startsWith("Rose ·")) material.color.set(theme.arrow);
      return material;
    });
  }, [parts.board.material, theme]);

  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );
  useEffect(() => {
    invalidate();
  }, [active, board, theme, invalidate]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const target = active ? 0.1 : 0;
    group.current.position.z +=
      (target - group.current.position.z) * Math.min(delta * 12, 1);
    if (Math.abs(target - group.current.position.z) > 0.001) invalidate();
    // Lift and pop of the button hover. Pixels become scene units through the
    // orthographic camera's zoom (pixels per unit).
    const goal = fxActive ? 1 : 0;
    lift.current += (goal - lift.current) * Math.min(delta * HOVER_RATE, 1);
    if (Math.abs(goal - lift.current) < 0.002) lift.current = goal;
    else invalidate();
    group.current.position.y =
      (lift.current * HOVER_LIFT_PX) / state.camera.zoom;
    pop.current?.scale.setScalar(1 + (HOVER_POP - 1) * lift.current);
  });

  return (
    <group
      name={`project-${board.project.slug}`}
      position={[0, board.height, 0]}
      rotation={[0, board.angle, 0]}
      dispose={null}
    >
      <mesh
        geometry={parts.mount.geometry}
        material={parts.mount.material}
        scale={[board.direction, 1, 1]}
        castShadow
      />
      <group
        ref={group}
        onPointerOver={(event) => {
          event.stopPropagation();
          // Touch and pens only slide out. A scroll makes the scene look again
          // with the wheel event, which has no pointer type, so "not touch or
          // pen" (rather than "is a mouse") keeps the effect on a sign that is
          // still under the pointer. The media query already rules out devices
          // without a hovering fine pointer.
          const type = event.nativeEvent.pointerType;
          setHover(
            type !== "touch" && type !== "pen" && SignHoverFx.available()
              ? "fx"
              : "plain",
          );
        }}
        onPointerOut={() => setHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          router.push(board.href);
        }}
        userData={{ href: board.href, title: board.project.title }}
      >
        <group ref={pop} position={pivot}>
          <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
            <mesh
              ref={boardMesh}
              geometry={parts.board.geometry}
              material={materials}
              scale={[board.direction * board.scaleX, 1, 1]}
              castShadow
            />
            {[false, true].map((back) => (
              <group key={String(back)}>
                <Text
                  position={[
                    board.direction *
                      (BOARD_TEMPLATE_CENTER + 0.08) *
                      board.scaleX,
                    0.015,
                    back ? 0.139 : 0.221,
                  ]}
                  rotation={[0, back ? Math.PI : 0, 0]}
                  font="/fonts/GoogleSans-SemiBold.ttf"
                  fontSize={board.fontSize}
                  color={theme.ink}
                  anchorX="center"
                  anchorY="middle"
                  whiteSpace="nowrap"
                  material-toneMapped={false}
                  onSync={invalidate}
                >
                  {board.title}
                </Text>
                <Text
                  position={[
                    board.direction * 0.14 * board.scaleX,
                    0.026,
                    back ? 0.139 : 0.221,
                  ]}
                  rotation={[0, back ? Math.PI : 0, 0]}
                  font="/fonts/GoogleSans-SemiBold.ttf"
                  fontSize={0.11}
                  color={theme.ink}
                  anchorX="center"
                  anchorY="middle"
                  material-toneMapped={false}
                  onSync={invalidate}
                >
                  {board.number}
                </Text>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
