"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { Material, MeshStandardMaterial } from "three";
import { useSignpostParts, useSignpostTheme } from "./SignpostParts";

/**
 * The pole is the opposite colour of the boards. The model's charcoal is kept
 * in dark mode; in light mode its charcoal parts become the theme's pole colour
 * (small clones, so the shared model materials are never touched).
 */
function recolour(
  material: Material | Material[],
  color: string | null,
  clones: MeshStandardMaterial[],
) {
  if (!color) return material;
  const paint = (source: Material) => {
    if (!source.name.startsWith("Charcoal")) return source;
    const clone = (source as MeshStandardMaterial).clone();
    clone.color.set(color);
    clones.push(clone);
    return clone;
  };
  return Array.isArray(material) ? material.map(paint) : paint(material);
}

export function Pole({ top }: { top: number }) {
  const parts = useSignpostParts();
  const theme = useSignpostTheme();
  const invalidate = useThree((state) => state.invalidate);
  const bottom = 0.57;
  const { materials, clones } = useMemo(() => {
    const clones: MeshStandardMaterial[] = [];
    return {
      clones,
      materials: {
        foot: recolour(parts.foot.material, theme.pole, clones),
        shaft: recolour(parts.shaft.material, theme.pole, clones),
        cap: recolour(parts.cap.material, theme.pole, clones),
      },
    };
  }, [parts, theme.pole]);
  useEffect(
    () => () => clones.forEach((material) => material.dispose()),
    [clones],
  );
  useEffect(() => {
    invalidate();
  }, [materials, invalidate]);
  return (
    <group dispose={null}>
      <mesh
        geometry={parts.foot.geometry}
        material={materials.foot}
        castShadow
      />
      <mesh
        geometry={parts.shaft.geometry}
        material={materials.shaft}
        position={[0, (top + bottom) / 2, 0]}
        scale={[1, top - bottom, 1]}
        castShadow
      />
      <mesh
        geometry={parts.cap.geometry}
        material={materials.cap}
        position={[0, top, 0]}
        castShadow
      />
    </group>
  );
}
