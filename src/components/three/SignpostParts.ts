"use client";

import { useGLTF } from "@react-three/drei";
import { useSyncExternalStore } from "react";
import {
  Mesh,
  type BufferGeometry,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { signpostThemes } from "@/lib/signpost-layout";

type Part = Mesh<BufferGeometry, MeshStandardMaterial | MeshStandardMaterial[]>;
const mergedParts = new WeakMap<Object3D, Part>();

export function useSignpostParts() {
  const { nodes } = useGLTF("/models/signpost-parts.glb", false, false);
  const part = (name: string): Part => {
    const node = nodes[name];
    if (!node) throw new Error(`Missing Blender signpost part: ${name}`);
    if (node instanceof Mesh) return node as Part;
    const cached = mergedParts.get(node);
    if (cached) return cached;
    // glTF represents a mesh with several materials as a group of primitives.
    const primitives: Part[] = [];
    node.traverse((child) => {
      if (child instanceof Mesh) primitives.push(child as Part);
    });
    const geometry = mergeGeometries(
      primitives.map((primitive) => primitive.geometry),
      true,
    );
    if (!geometry) throw new Error(`Invalid Blender signpost part: ${name}`);
    const merged = new Mesh(
      geometry,
      primitives.flatMap((primitive) =>
        Array.isArray(primitive.material)
          ? primitive.material
          : [primitive.material],
      ),
    );
    mergedParts.set(node, merged);
    return merged;
  };
  return {
    board: part("Board"),
    mount: part("Mount"),
    foot: part("Foot"),
    shaft: part("Shaft"),
    cap: part("Cap"),
  };
}

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function useSignpostTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light",
  );
  return signpostThemes[theme as keyof typeof signpostThemes];
}
