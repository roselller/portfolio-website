"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Text, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import type { Group } from "three";
import {
  BOARD_TEMPLATE_CENTER,
  type SignboardLayout,
  type SignpostTheme,
} from "@/lib/signpost-layout";
import { useSignpostParts } from "./SignpostParts";

export function SignArm({
  board,
  theme,
}: {
  board: SignboardLayout;
  theme: SignpostTheme;
}) {
  const parts = useSignpostParts();
  const router = useRouter();
  const group = useRef<Group>(null);
  const [active, setActive] = useState(false);
  const invalidate = useThree((state) => state.invalidate);
  useCursor(active);

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

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 0.1 : 0;
    group.current.position.z +=
      (target - group.current.position.z) * Math.min(delta * 12, 1);
    if (Math.abs(target - group.current.position.z) > 0.001) invalidate();
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
          setActive(true);
        }}
        onPointerOut={() => setActive(false)}
        onClick={(event) => {
          event.stopPropagation();
          router.push(board.href);
        }}
        userData={{ href: board.href, title: board.project.title }}
      >
        <mesh
          geometry={parts.board.geometry}
          material={materials}
          scale={[board.direction * board.scaleX, 1, 1]}
          castShadow
        />
        {[false, true].map((back) => (
          <group key={String(back)}>
            <Text
              position={[
                board.direction * (BOARD_TEMPLATE_CENTER + 0.08) * board.scaleX,
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
              font="/fonts/Miracode.ttf"
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
  );
}
