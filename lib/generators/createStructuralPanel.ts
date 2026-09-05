import type { MaterialSelection, ScenePart } from "@/lib/cabinet/types";

export type StructuralPanelInput = {
  id: string;
  panelType: "側落板" | "側封板";
  thickness: number;
  cabinetHeight: number;
  cabinetDepth: number;
  elevation: number;
  frontExtension: number;
  material: MaterialSelection;
};

/**
 * 結構板材以櫃體本地 YZ 平面建立；布局旋轉後會自動對應 X／Y 排方向。
 * 側落板由地面延伸至櫃頂，側封板則從櫃體離地高度開始。
 */
export function createStructuralPanel(input: StructuralPanelInput): ScenePart[] {
  const isFloorPanel = input.panelType === "側落板";
  const height = input.cabinetHeight + (isFloorPanel ? input.elevation : 0);
  const worldBottom = isFloorPanel ? 0 : input.elevation;
  const localCenterZ = worldBottom + height / 2 - input.elevation;
  const depth = input.cabinetDepth + input.frontExtension;

  return [{
    id: `${input.id}-structural-panel`,
    kind: "structural-panel",
    size: {
      width: input.thickness,
      depth,
      height,
    },
    position: {
      x: input.thickness / 2,
      // 櫃身從 Y=0 往後延伸；額外的 20 mm 往門板方向（-Y）延伸。
      y: (input.cabinetDepth - input.frontExtension) / 2,
      z: localCenterZ,
    },
    rotationZ: 0,
    material: input.material,
  }];
}
