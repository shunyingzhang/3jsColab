export type Vector3 = { x: number; y: number; z: number };

export type BoxSize = {
  width: number;
  depth: number;
  height: number;
};

export type MaterialSelection = {
  file: string;
  name: string;
  textureUrl: string;
  category?: string;
  series?: string;
};

export type ScenePartKind =
  | "door"
  | "drawer-front"
  | "carcass"
  | "handle"
  | "fixed-shelf"
  | "adjustable-shelf"
  | "structural-panel"
  | "appliance"
  | "benchtop"
  | "backsplash"
  | "adjustable-leg";

export type ScenePart = {
  id: string;
  kind: ScenePartKind;
  size: BoxSize;
  position: Vector3;
  rotationZ: number;
  material: MaterialSelection | { color: string; name: string };
  geometry?:
    | { type: "box" }
    | { type: "cylinder"; radiusTop?: number; radiusBottom?: number; radialSegments?: number; axis?: "x" | "y" | "z" }
    | { type: "c-profile"; wall: number }
    | { type: "rounded-box"; radii: { frontRight: number; backRight: number; backLeft: number; frontLeft: number } }
    | { type: "slanted-plate"; angleDegrees: number };
};

export type CabinetModelCode =
  | "BU-H-BD3O-D--0X00XX056"
  | "BU-H-BA-X-X--0X00XX056"
  | "BUH-H-BA---X--0X0XXX056"
  | "BUH-H-BA--1X--060XXX056"
  | "benchtop_1"
  | "WU-H-WAX--X--0X00XX035"
  | "BU-H-BF3-----0120XX056"
  | "WU-H-WF3-----0120XX035"
  | "BUH-H-BF5-----0120XX056"
  | "BU-H-spaceholder"
  | "BUH-H-spaceholder"
  | "WU-H-spaceholder"
  | "BU-H-side-floor-panel"
  | "BU-H-side-panel"
  | "WU-H-side-floor-panel"
  | "WU-H-side-panel";

export type CabinetLayoutGroup = "base" | "wall";
export type SalesItemKind = "cabinet" | "spaceholder" | "structural-panel" | "benchtop";
export type CabinetClass = "base" | "wall" | "tall";

export type CabinetFront = {
  id: string;
  name: string;
  type: "door" | "drawer";
  quantity: number;
  size?: { width: number; height: number };
  material?: MaterialSelection;
  openingMethod?: import("@/lib/rules/handleCatalog").DoorOpeningMethod;
  handle?: import("@/lib/rules/handleCatalog").HandleSelection;
};

export type CadLengthParameter = { type: "length"; value: number };
export type CadModelParameterValue = string | number | boolean | null | CadLengthParameter;
export type CadModelParameters = Record<string, CadModelParameterValue>;

export type CabinetParameters = {
  adjustableShelfCount?: number;
  adjustableLegHeight?: number;
  doorCount?: 0 | 1 | 2;
};

export type CabinetPlacement = {
  run: "x" | "y";
  runIndex: number;
  sequence: number;
  p1: Vector3;
  p2: Vector3;
};

export type CabinetRequest = {
  instanceId: string;
  modelCode: CabinetModelCode;
  layoutGroup: CabinetLayoutGroup;
  cabinetClass?: CabinetClass;
  name?: string;
  size: BoxSize;
  position: Vector3;
  rotationDegrees: number;
  doorMaterial: MaterialSelection;
  carcassMaterial: MaterialSelection;
  handle: import("@/lib/rules/handleCatalog").HandleSelection;
  parameters?: CabinetParameters;
  /** 櫃型專屬參數，例如未來高櫃各門區高度或設備型號。 */
  modelParameters?: CadModelParameters;
  placement?: CabinetPlacement;
};

export type SalesCabinetModel = CabinetRequest & {
  modelName: string;
  kind: SalesItemKind;
  cabinetClass?: CabinetClass;
  /** AutoCAD 插件實際呼叫的共用文件；未設定時使用 modelCode。 */
  cadModelCode?: string;
  /** 櫃型產生的實際 CAD 尺寸；未設定時使用 size。內部單位為 mm。 */
  cadSize?: BoxSize;
  /** 櫃型產生的實際 CAD 離地高度；未設定時使用 position.z。內部單位為 mm。 */
  cadBaseElevation?: number;
  /** 每組門板或抽屜面擁有獨立材質、開啟方式與把手。 */
  fronts?: CabinetFront[];
  /** 只屬於目前櫃型的 CAD 參數。 */
  cadParameters?: CadModelParameters;
  canAlignWallCabinet: boolean;
  /** CAD 使用的逆時針布局路徑；未提供時沿用 Three.js placement。 */
  cadPlacement?: CabinetPlacement;
  parts: ScenePart[];
};
