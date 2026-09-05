import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";

export type AdjustableShelfInput = {
  id: string;
  width: number;
  depth: number;
  thickness: number;
  heightsZ: number[];
  material: MaterialSelection;
  positionX?: number;
  positionY?: number;
};

/** 活隔：可由櫃型傳入一或多個安裝高度。 */
export function createAdjustableShelves(input: AdjustableShelfInput): ScenePart[] {
  return input.heightsZ.map((heightZ, index) => ({
    id: `${input.id}-adjustable-shelf-${index + 1}`,
    kind: "adjustable-shelf",
    size: {
      width: input.width,
      depth: input.depth,
      height: input.thickness,
    },
    position: {
      x: input.positionX ?? input.width / 2,
      y: input.positionY ?? input.depth / 2,
      z: heightZ,
    },
    rotationZ: 0,
    material: input.material,
  }));
}
