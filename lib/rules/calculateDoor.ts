import type { Vector3 } from "@/lib/cabinet/types";
import { designStandards } from "@/lib/config/designStandards";
import { getDoorHeightReduction, type HandleSelection } from "@/lib/rules/handleCatalog";

export function calculateDoor(input: {
  nominalWidth: number;
  nominalHeight: number;
  position: Vector3;
  handle: HandleSelection;
}) {
  const reduction = getDoorHeightReduction(input.handle);
  const height = Math.max(1, input.nominalHeight - reduction);
  const reductionAtBottom = input.handle.category === "上崁把手"
    && input.handle.verticalPosition === "下沿";
  return {
    width: Math.max(1, input.nominalWidth),
    height,
    thickness: designStandards.board.doorThickness,
    position: {
      ...input.position,
      z: input.position.z + (reductionAtBottom ? reduction / 2 : -reduction / 2),
    },
  };
}
