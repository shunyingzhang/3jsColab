import { buildCabinet, cabinetOptions } from "@/lib/catalog/cabinetCatalog";
import type {
  CabinetClass,
  CabinetLayoutGroup,
  CabinetModelCode,
  CabinetRequest,
  MaterialSelection,
  SalesCabinetModel,
} from "@/lib/cabinet/types";
import type { HandleSelection } from "@/lib/rules/handleCatalog";

export type BasicLayoutSettings = {
  modelCode: CabinetModelCode;
  xCount: number;
  yCount: number;
  width: number;
  height: number;
  depth: number;
  elevation: number;
  doorCount: 0 | 1 | 2;
  adjustableShelfCount: number;
  doorMaterial: MaterialSelection;
  carcassMaterial: MaterialSelection;
  handle: HandleSelection;
};

export function getModelDefaults(modelCode: CabinetModelCode) {
  const option = cabinetOptions.find((item) => item.modelCode === modelCode);
  const cabinetClass: CabinetClass = option?.cabinetClass
    ?? (option?.layoutGroup === "wall" ? "wall" : option?.menuCategories.includes("tall") ? "tall" : "base");
  const fallback = cabinetClass === "wall"
    ? { width: 800, height: 704, depth: 350, elevation: 1496 }
    : cabinetClass === "tall"
      ? { width: 600, height: 2080, depth: 560, elevation: 120 }
      : { width: 800, height: 704, depth: 560, elevation: 120 };
  return {
    option,
    cabinetClass,
    width: option?.defaultSize?.width ?? fallback.width,
    height: option?.defaultSize?.height ?? fallback.height,
    depth: option?.defaultSize?.depth ?? fallback.depth,
    elevation: fallback.elevation,
    doorCount: option?.fixedDoorCount ?? option?.defaultDoorCount ?? 2,
    adjustableShelfCount: option?.fixedAdjustableShelfCount ?? option?.defaultAdjustableShelfCount ?? 1,
  };
}

/** 分享版基礎布局：X排從右向左，再由轉角沿Y方向從後向前。 */
export function createBasicLayout(settings: BasicLayoutSettings): SalesCabinetModel[] {
  const defaults = getModelDefaults(settings.modelCode);
  const layoutGroup: CabinetLayoutGroup = defaults.option?.layoutGroup ?? "base";
  const result: SalesCabinetModel[] = [];
  let xCursor = settings.xCount * settings.width;

  const makeRequest = (
    instanceId: string,
    position: CabinetRequest["position"],
    rotationDegrees: number,
    run: "x" | "y",
    runIndex: number,
    p1: CabinetRequest["position"],
    p2: CabinetRequest["position"],
  ): CabinetRequest => ({
    instanceId,
    modelCode: settings.modelCode,
    layoutGroup,
    cabinetClass: defaults.cabinetClass,
    size: { width: settings.width, height: settings.height, depth: settings.depth },
    position,
    rotationDegrees,
    doorMaterial: settings.doorMaterial,
    carcassMaterial: settings.carcassMaterial,
    handle: settings.handle,
    parameters: {
      doorCount: settings.doorCount,
      adjustableShelfCount: settings.adjustableShelfCount,
      adjustableLegHeight: settings.elevation,
    },
    placement: { run, runIndex, sequence: result.length + 1, p1, p2 },
  });

  for (let index = 0; index < settings.xCount; index += 1) {
    const p1 = { x: xCursor, y: 0, z: settings.elevation };
    const p2 = { x: xCursor - settings.width, y: 0, z: settings.elevation };
    result.push(buildCabinet(makeRequest(`x-${index + 1}`, p2, 0, "x", index + 1, p1, p2)));
    xCursor = p2.x;
  }

  let yCursor = -20;
  for (let index = 0; index < settings.yCount; index += 1) {
    const p1 = { x: 0, y: yCursor, z: settings.elevation };
    const p2 = { x: 0, y: yCursor - settings.width, z: settings.elevation };
    result.push(buildCabinet(makeRequest(`y-${index + 1}`, p1, -90, "y", index + 1, p1, p2)));
    yCursor = p2.y;
  }

  return result;
}
