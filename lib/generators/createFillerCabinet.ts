import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";
import { createCarcass } from "@/lib/generators/createCarcass";
import { designStandards } from "@/lib/config/designStandards";

export type FillerCabinetInput = {
  id: string;
  width: number;
  height: number;
  depth: number;
  doorHeightReduction?: number;
  carcassMaterial: MaterialSelection;
  doorMaterial: MaterialSelection;
};

/**
 * 地櫃、牆櫃與高櫃填縫共用的簡化外觀。
 * 生產端仍依各自 modelCode 呼叫不同 CAD 文件。
 */
export function createFillerCabinet(input: FillerCabinetInput): ScenePart[] {
  const doorWidth = Math.max(1, input.width - designStandards.doorGap.left - designStandards.doorGap.right);
  const doorHeightReduction = input.doorHeightReduction ?? 0;
  const nominalDoorHeight = input.height - designStandards.doorGap.top - designStandards.doorGap.bottom;
  const doorHeight = Math.max(1, nominalDoorHeight - doorHeightReduction);
  return [
    ...createCarcass({
      id: input.id,
      width: input.width,
      height: input.height,
      depth: input.depth,
      material: input.carcassMaterial,
    }),
    {
    id: `${input.id}-filler-cabinet`,
    kind: "door",
    size: { width: doorWidth, height: doorHeight, depth: designStandards.board.doorThickness },
    position: {
      x: designStandards.doorGap.left + doorWidth / 2,
      y: -designStandards.board.doorThickness / 2,
      // G 把在上時從門板上方扣減，底緣維持不動。
      z: designStandards.doorGap.bottom + doorHeight / 2,
    },
    rotationZ: 0,
    material: input.doorMaterial,
    geometry: { type: "box" },
    },
  ];
}
