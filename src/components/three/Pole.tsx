"use client";

import { useSignpostParts } from "./SignpostParts";

export function Pole({ top }: { top: number }) {
  const parts = useSignpostParts();
  const bottom = 0.57;
  return (
    <group dispose={null}>
      <mesh
        geometry={parts.foot.geometry}
        material={parts.foot.material}
        castShadow
      />
      <mesh
        geometry={parts.shaft.geometry}
        material={parts.shaft.material}
        position={[0, (top + bottom) / 2, 0]}
        scale={[1, top - bottom, 1]}
        castShadow
      />
      <mesh
        geometry={parts.cap.geometry}
        material={parts.cap.material}
        position={[0, top, 0]}
        castShadow
      />
    </group>
  );
}
