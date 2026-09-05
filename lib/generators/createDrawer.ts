import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";
import { createDoor } from "@/lib/generators/createDoor";
import type { HandleSelection } from "@/lib/rules/handleCatalog";

export type DrawerSetInput = {
  id: string;
  width: number;
  height: number;
  /** 比例陣列長度就是抽屜數量，例如二抽 [1, 2]、三抽 [1, 1, 2]。 */
  heightRatios: readonly number[];
  frontY: number;
  bottomZ: number;
  leftX?: number;
  material: MaterialSelection;
  handle: HandleSelection;
  gap?: number;
};

export function createDrawerSet(input: DrawerSetInput): ScenePart[] {
  const gap = input.gap ?? 3;
  const ratios = normalizeHeightRatios(input.heightRatios);
  const usableHeight = Math.max(1, input.height - gap * (ratios.length - 1));
  const ratioTotal = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const frontHeights = ratios.map((ratio) => usableHeight * ratio / ratioTotal);
  let heightBefore = 0;

  return frontHeights.flatMap((frontHeight, index) => {
    const centerZ = input.bottomZ + heightBefore + frontHeight / 2 + index * gap;
    heightBefore += frontHeight;
    return createDoor({
      id: `${input.id}-${index + 1}`,
      kind: "drawer-front",
      nominalWidth: input.width,
      nominalHeight: frontHeight,
      position: { x: (input.leftX ?? 0) + input.width / 2, y: input.frontY, z: centerZ },
      material: input.material,
      handle: {
        ...input.handle,
        horizontalPosition: "中間",
        verticalPosition: "中間",
      },
    });
  });
}

function normalizeHeightRatios(heightRatios: readonly number[]) {
  const valid = heightRatios.map((ratio) => Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
  return valid.length > 0 ? valid : [1];
}
