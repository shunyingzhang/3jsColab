import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";
import { designStandards } from "@/lib/config/designStandards";

export type CarcassInput = {
  id: string;
  width: number;
  height: number;
  depth: number;
  material: MaterialSelection;
  thickness?: number;
  backThickness?: number;
  adjustableLegs?: {
    height: number;
    diameter?: number;
    inset?: number;
  };
};

export function createCarcass(input: CarcassInput): ScenePart[] {
  const thickness = Math.min(
    input.thickness ?? designStandards.board.carcassThickness,
    input.width / 3,
    input.height / 3,
  );
  const backThickness = Math.min(input.backThickness ?? thickness, input.depth / 3);
  const innerWidth = Math.max(1, input.width - thickness * 2);
  const innerHeight = Math.max(1, input.height - thickness * 2);
  const common = {
    kind: "carcass" as const,
    rotationZ: 0,
    material: input.material,
  };

  // 櫃身由獨立板件組成，正面保持開放；沒有門板時也能看到內部空間。
  const parts: ScenePart[] = [
    {
      ...common,
      id: `${input.id}-carcass-left-side`,
      size: { width: thickness, depth: input.depth, height: input.height },
      position: { x: thickness / 2, y: input.depth / 2, z: input.height / 2 },
    },
    {
      ...common,
      id: `${input.id}-carcass-right-side`,
      size: { width: thickness, depth: input.depth, height: input.height },
      position: { x: input.width - thickness / 2, y: input.depth / 2, z: input.height / 2 },
    },
    {
      ...common,
      id: `${input.id}-carcass-bottom`,
      size: { width: innerWidth, depth: input.depth, height: thickness },
      position: { x: input.width / 2, y: input.depth / 2, z: thickness / 2 },
    },
    {
      ...common,
      id: `${input.id}-carcass-top`,
      size: { width: innerWidth, depth: input.depth, height: thickness },
      position: { x: input.width / 2, y: input.depth / 2, z: input.height - thickness / 2 },
    },
    {
      ...common,
      id: `${input.id}-carcass-back`,
      size: { width: innerWidth, depth: backThickness, height: innerHeight },
      position: { x: input.width / 2, y: input.depth - backThickness / 2, z: input.height / 2 },
    },
  ];

  if (!input.adjustableLegs) return parts;

  const diameter = input.adjustableLegs.diameter ?? 40;
  const inset = Math.min(input.adjustableLegs.inset ?? 70, input.width / 3, input.depth / 3);
  const legPositions = [
    [inset, inset],
    [input.width - inset, inset],
    [inset, input.depth - inset],
    [input.width - inset, input.depth - inset],
  ];

  parts.push(...legPositions.map(([x, y], index): ScenePart => ({
    id: `${input.id}-adjustable-leg-${index + 1}`,
    kind: "adjustable-leg",
    size: { width: diameter, depth: diameter, height: input.adjustableLegs!.height },
    position: { x, y, z: -input.adjustableLegs!.height / 2 },
    rotationZ: 0,
    material: { color: "#171717", name: "黑色調整腳" },
  })));

  return parts;
}
