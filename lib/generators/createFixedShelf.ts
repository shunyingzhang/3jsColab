import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";

export type FixedShelfInput = {
  id: string;
  width: number;
  depth: number;
  thickness: number;
  heightZ: number;
  material: MaterialSelection;
  positionX?: number;
  positionY?: number;
};

/** 固隔：固定在櫃體指定高度的水平板件。 */
export function createFixedShelf(input: FixedShelfInput): ScenePart[] {
  return [{
    id: `${input.id}-fixed-shelf`,
    kind: "fixed-shelf",
    size: {
      width: input.width,
      depth: input.depth,
      height: input.thickness,
    },
    position: {
      x: input.positionX ?? input.width / 2,
      y: input.positionY ?? input.depth / 2,
      z: input.heightZ,
    },
    rotationZ: 0,
    material: input.material,
  }];
}
