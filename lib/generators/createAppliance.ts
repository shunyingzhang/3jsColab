import type { ScenePart } from "@/lib/cabinet/types";

export type ApplianceInput = {
  id: string;
  width: number;
  height: number;
  depth: number;
  position: { x: number; y: number; z: number };
  name?: string;
};

/** 銷售端電器占位：先用黑色盒體表達安裝範圍，日後可統一替換貼圖或 GLB。 */
export function createAppliance(input: ApplianceInput): ScenePart[] {
  return [{
    id: `${input.id}-appliance`,
    kind: "appliance",
    size: {
      width: input.width,
      height: input.height,
      depth: input.depth,
    },
    position: input.position,
    rotationZ: 0,
    material: { color: "#101214", name: input.name ?? "黑色電器占位" },
    geometry: { type: "box" },
  }];
}
