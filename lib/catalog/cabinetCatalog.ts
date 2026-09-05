import type {
  CabinetClass,
  CabinetFront,
  CabinetLayoutGroup,
  CabinetModelCode,
  CabinetRequest,
  CadModelParameters,
  SalesCabinetModel,
  SalesItemKind,
  ScenePart,
} from "@/lib/cabinet/types";
import type { DoorOpeningMethod, HandleVerticalPosition } from "@/lib/rules/handleCatalog";
import { createCarcass } from "@/lib/generators/createCarcass";
import { createDoor } from "@/lib/generators/createDoor";
import { createDrawerSet } from "@/lib/generators/createDrawer";
import { createAdjustableShelves } from "@/lib/generators/createAdjustableShelf";
import { createFixedShelf } from "@/lib/generators/createFixedShelf";
import { createAppliance } from "@/lib/generators/createAppliance";
import { createStructuralPanel } from "@/lib/generators/createStructuralPanel";
import { createFillerCabinet } from "@/lib/generators/createFillerCabinet";
import { designStandards } from "@/lib/config/designStandards";
import { calculateDoor } from "@/lib/rules/calculateDoor";

type CabinetDefinition = {
  modelCode: CabinetModelCode;
  cadModelCode?: string;
  name: string;
  kind: SalesItemKind;
  cabinetClass?: CabinetClass;
  layoutGroup: CabinetLayoutGroup;
  menuCategories?: ("base" | "tall" | "wall")[];
  canAlignWallCabinet: boolean;
  frontType?: "door" | "drawer" | "multi" | "none";
  supportsAdjustableShelves?: boolean;
  defaultSize?: Partial<CabinetRequest["size"]>;
  /** 自動布局可選用的公司標準寬度，單位為 mm。 */
  standardWidths?: readonly number[];
  minWidth?: number;
  maxWidth?: number;
  allowCustomWidth?: boolean;
  defaultDoorCount?: 0 | 1 | 2;
  defaultAdjustableShelfCount?: number;
  fixedDoorCount?: 0 | 1 | 2;
  fixedShelfCount?: number;
  fixedAdjustableShelfCount?: number;
  fixedOpeningMethod?: DoorOpeningMethod;
  defaultModelParameters?: CadModelParameters;
  handleVerticalPosition?: HandleVerticalPosition;
  railHandleFilename?: "G把在上" | "L把在下" | "L把左開" | "L把右開";
  buildLocalParts: (request: CabinetRequest) => ScenePart[];
  buildFronts?: (request: CabinetRequest) => CabinetFront[];
  buildCadData?: (request: CabinetRequest) => {
    size?: CabinetRequest["size"];
    baseElevation?: number;
    parameters?: CadModelParameters;
  };
};

const frontGap = designStandards.doorGap.between;
const structuralPanelCadModelCode = "strc-cabbody-door_1";
// 在這裡調整目前三抽屜櫃的高度比例；陣列長度同時決定抽屜數量。
const threeDrawerHeightRatios = [35.2, 16, 19.6] as const;
// 高櫃隔板位置由櫃底往上計算，可在此直接調整比例。
const tallCabinetFixedShelfHeightRatios = [1 / 3, 2 / 3] as const;
const applianceTallDoorHeight = 704;

function buildStructuralPanel(request: CabinetRequest, panelType: "側落板" | "側封板") {
  return createStructuralPanel({
    id: request.instanceId,
    panelType,
    thickness: request.size.width,
    cabinetHeight: request.size.height,
    cabinetDepth: request.size.depth,
    elevation: request.position.z,
    frontExtension: designStandards.structuralPanel.frontExtension,
    material: request.doorMaterial,
  });
}

function buildFillerFronts(request: CabinetRequest): CabinetFront[] {
  const doorHeightReduction = getFillerDoorHeightReduction(request);
  return [{
    id: "filler-front",
    name: "填縫門板",
    type: "door",
    quantity: 1,
    size: {
      width: Math.max(1, request.size.width - designStandards.doorGap.left - designStandards.doorGap.right),
      height: Math.max(
        1,
        request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom - doorHeightReduction,
      ),
    },
    material: request.doorMaterial,
  }];
}

function getFillerDoorHeightReduction(request: CabinetRequest) {
  return request.modelCode === "BU-H-BF3-----0120XX056"
    && request.handle.category === "L把或G把"
    && request.handle.filename === "G把在上"
    ? designStandards.handle.gHandleReduction
    : 0;
}

function buildDoorFronts(request: CabinetRequest): CabinetFront[] {
  const doorCount = request.parameters?.doorCount ?? (request.size.width <= 600 ? 1 : 2);
  if (doorCount === 0) return [{
    id: "main-doors",
    name: "門板",
    type: "door",
    quantity: 0,
  }];
  const isSingleDoor = doorCount === 1;
  const availableWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;
  const width = isSingleDoor ? availableWidth : (availableWidth - frontGap) / 2;
  const nominalHeight = request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom;
  const frontSize = (handle: CabinetRequest["handle"]) => {
    const calculated = calculateDoor({ nominalWidth: width, nominalHeight, position: { x: 0, y: 0, z: 0 }, handle });
    return { width: calculated.width, height: calculated.height };
  };
  return [{
    id: "main-doors",
    name: "門板",
    type: "door",
    quantity: doorCount,
    size: frontSize(request.handle),
    material: request.doorMaterial,
    openingMethod: request.handle.openingMethod,
    handle: request.handle,
  }];
}

function buildDrawerFronts(request: CabinetRequest, count: number): CabinetFront[] {
  const handle = { ...request.handle, horizontalPosition: "中間" as const, verticalPosition: "中間" as const };
  return [{
    id: "drawers",
    name: "抽屜面",
    type: "drawer",
    quantity: count,
    material: request.doorMaterial,
    openingMethod: handle.openingMethod,
    handle,
  }];
}

function buildDrawerCabinet(request: CabinetRequest, heightRatios: readonly number[]) {
  return [
    ...createCarcass({
      id: request.instanceId,
      ...request.size,
      material: request.carcassMaterial,
      adjustableLegs: { height: request.parameters?.adjustableLegHeight ?? 120 },
    }),
    ...createDrawerSet({
      id: `${request.instanceId}-drawers`,
      width: request.size.width - designStandards.doorGap.left - designStandards.doorGap.right,
      height: request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom,
      heightRatios,
      frontY: -9,
      bottomZ: designStandards.doorGap.bottom,
      leftX: designStandards.doorGap.left,
      material: request.doorMaterial,
      handle: request.handle,
    }),
  ];
}

function buildStructuralPanelCadData(request: CabinetRequest, panelType: "側落板" | "側封板") {
  const isFloorPanel = panelType === "側落板";
  return {
    size: {
      width: request.size.width,
      height: request.size.height + (isFloorPanel ? request.position.z : 0),
      depth: request.size.depth + designStandards.structuralPanel.frontExtension,
    },
    baseElevation: isFloorPanel ? 0 : request.position.z,
    parameters: { panelType },
  };
}

function buildTallShelfCabinet(request: CabinetRequest) {
  const shelfCommon = {
    width: Math.max(100, request.size.width - designStandards.board.carcassThickness * 2),
    depth: Math.max(100, request.size.depth - 54),
    thickness: designStandards.board.carcassThickness,
    positionX: request.size.width / 2,
    positionY: request.size.depth / 2,
    material: request.carcassMaterial,
  };
  const doorWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;
  const doorHeight = request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom;
  const doorCount = request.parameters?.doorCount ?? 1;
  const singleDoorWidth = doorCount === 1 ? doorWidth : (doorWidth - frontGap) / 2;
  const adjustableShelfCount = Math.max(0, Math.floor(request.parameters?.adjustableShelfCount ?? 3));
  const adjustableShelfHeights = distributeShelvesBetweenFixedShelves(
    request.size.height,
    adjustableShelfCount,
    tallCabinetFixedShelfHeightRatios,
  );
  return [
    ...createCarcass({
      id: request.instanceId,
      ...request.size,
      material: request.carcassMaterial,
      adjustableLegs: { height: request.parameters?.adjustableLegHeight ?? 120 },
    }),
    ...tallCabinetFixedShelfHeightRatios.flatMap((ratio, index) => createFixedShelf({
      id: `${request.instanceId}-${index + 1}`,
      ...shelfCommon,
      heightZ: request.size.height * ratio,
    })),
    ...createAdjustableShelves({
      id: request.instanceId,
      ...shelfCommon,
      heightsZ: adjustableShelfHeights,
    }),
    ...(doorCount === 0 ? [] : createDoor({
      id: `${request.instanceId}-single-door`,
      nominalWidth: singleDoorWidth,
      nominalHeight: doorHeight,
      position: {
        x: designStandards.doorGap.left + singleDoorWidth / 2,
        y: -9,
        z: designStandards.doorGap.bottom + doorHeight / 2,
      },
      material: request.doorMaterial,
      handle: doorCount === 1 ? request.handle : { ...request.handle, horizontalPosition: "右" },
    })),
    ...(doorCount === 2 ? createDoor({
      id: `${request.instanceId}-right-door`,
      nominalWidth: singleDoorWidth,
      nominalHeight: doorHeight,
      position: {
        x: designStandards.doorGap.left + singleDoorWidth + frontGap + singleDoorWidth / 2,
        y: -9,
        z: designStandards.doorGap.bottom + doorHeight / 2,
      },
      material: request.doorMaterial,
      handle: { ...request.handle, horizontalPosition: "左" },
    }) : []),
  ];
}

function distributeShelvesBetweenFixedShelves(
  height: number,
  count: number,
  fixedRatios: readonly number[],
) {
  if (count === 0) return [];
  const boundaries = [0, ...fixedRatios, 1];
  const compartmentCount = boundaries.length - 1;
  const baseCount = Math.floor(count / compartmentCount);
  const remainder = count % compartmentCount;
  return Array.from({ length: compartmentCount }, (_, compartmentIndex) => {
    const shelfCount = baseCount + (compartmentIndex < remainder ? 1 : 0);
    const lower = boundaries[compartmentIndex];
    const upper = boundaries[compartmentIndex + 1];
    return Array.from(
      { length: shelfCount },
      (_, shelfIndex) => height * (lower + (upper - lower) * (shelfIndex + 1) / (shelfCount + 1)),
    );
  }).flat();
}

function buildApplianceTallFronts(request: CabinetRequest): CabinetFront[] {
  const doorWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;
  const createFront = (
    id: string,
    name: string,
    verticalPosition: "上沿" | "下沿",
  ): CabinetFront => {
    const handle = { ...request.handle, verticalPosition };
    const calculated = calculateDoor({
      nominalWidth: doorWidth,
      nominalHeight: applianceTallDoorHeight,
      position: { x: 0, y: 0, z: 0 },
      handle,
    });
    return {
      id,
      name,
      type: "door",
      quantity: 1,
      size: { width: calculated.width, height: calculated.height },
      material: request.doorMaterial,
      openingMethod: handle.openingMethod,
      handle,
    };
  };
  return [
    createFront("lower-door", "下門板", "上沿"),
    createFront("upper-door", "上門板", "下沿"),
  ];
}

function buildApplianceTallCabinet(request: CabinetRequest) {
  const boardThickness = designStandards.board.carcassThickness;
  const doorBottom = designStandards.doorGap.bottom;
  const lowerDoorTop = doorBottom + applianceTallDoorHeight;
  const upperDoorBottom = request.size.height - designStandards.doorGap.top - applianceTallDoorHeight;
  const lowerFixedShelfZ = lowerDoorTop + boardThickness / 2;
  const upperFixedShelfZ = upperDoorBottom - boardThickness / 2;
  const lowerApplianceZ = lowerFixedShelfZ + boardThickness / 2;
  const upperApplianceZ = upperFixedShelfZ - boardThickness / 2;
  const applianceHeight = Math.max(1, upperApplianceZ - lowerApplianceZ);
  const shelfCommon = {
    width: Math.max(100, request.size.width - boardThickness * 2),
    depth: Math.max(100, request.size.depth - 54),
    thickness: boardThickness,
    positionX: request.size.width / 2,
    positionY: request.size.depth / 2,
    material: request.carcassMaterial,
  };
  const doorWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;

  return [
    ...createCarcass({
      id: request.instanceId,
      ...request.size,
      material: request.carcassMaterial,
      adjustableLegs: { height: request.parameters?.adjustableLegHeight ?? 120 },
    }),
    ...createFixedShelf({ id: `${request.instanceId}-lower`, ...shelfCommon, heightZ: lowerFixedShelfZ }),
    ...createFixedShelf({ id: `${request.instanceId}-upper`, ...shelfCommon, heightZ: upperFixedShelfZ }),
    ...createAdjustableShelves({
      id: `${request.instanceId}-door-compartments`,
      ...shelfCommon,
      heightsZ: [
        (boardThickness + lowerDoorTop) / 2,
        (upperDoorBottom + request.size.height - boardThickness) / 2,
      ],
    }),
    ...createAppliance({
      id: request.instanceId,
      name: "大電器",
      width: Math.max(100, request.size.width - boardThickness * 2 - 8),
      height: applianceHeight,
      depth: Math.max(80, request.size.depth - 70),
      position: {
        x: request.size.width / 2,
        y: Math.max(80, request.size.depth - 70) / 2,
        z: lowerApplianceZ + applianceHeight / 2,
      },
    }),
    ...createDoor({
      id: `${request.instanceId}-lower-door`,
      nominalWidth: doorWidth,
      nominalHeight: applianceTallDoorHeight,
      position: {
        x: designStandards.doorGap.left + doorWidth / 2,
        y: -9,
        z: doorBottom + applianceTallDoorHeight / 2,
      },
      material: request.doorMaterial,
      handle: { ...request.handle, verticalPosition: "上沿" },
    }),
    ...createDoor({
      id: `${request.instanceId}-upper-door`,
      nominalWidth: doorWidth,
      nominalHeight: applianceTallDoorHeight,
      position: {
        x: designStandards.doorGap.left + doorWidth / 2,
        y: -9,
        z: request.size.height - designStandards.doorGap.top - applianceTallDoorHeight / 2,
      },
      material: request.doorMaterial,
      handle: { ...request.handle, verticalPosition: "下沿" },
    }),
  ];
}

const definitions: Record<CabinetModelCode, CabinetDefinition> = {
  "benchtop_1": {
    modelCode: "benchtop_1",
    name: "一字型台面",
    kind: "benchtop",
    layoutGroup: "base",
    menuCategories: [],
    canAlignWallCabinet: false,
    buildLocalParts: () => [],
  },
  "BU-H-BD3O-D--0X00XX056": {
    modelCode: "BU-H-BD3O-D--0X00XX056",
    name: "外3抽屜地櫃",
    kind: "cabinet",
    cabinetClass: "base",
    layoutGroup: "base",
    menuCategories: ["base"],
    canAlignWallCabinet: true,
    frontType: "drawer",
    defaultSize: { width: 800, height: 704, depth: 560 },
    standardWidths: [400, 450, 500, 600, 800, 900, 1000],
    defaultModelParameters: { cutleryTray: false },
    handleVerticalPosition: "中間",
    railHandleFilename: "G把在上",
    buildFronts: (request) => buildDrawerFronts(request, threeDrawerHeightRatios.length),
    buildLocalParts: (request) => buildDrawerCabinet(request, threeDrawerHeightRatios),
  },
  "BU-H-BA-X-X--0X00XX056": {
    modelCode: "BU-H-BA-X-X--0X00XX056",
    name: "活動層板地櫃",
    kind: "cabinet",
    cabinetClass: "base",
    layoutGroup: "base",
    menuCategories: ["base"],
    canAlignWallCabinet: true,
    frontType: "door",
    defaultSize: { width: 800, height: 704, depth: 560 },
    standardWidths: [150, 200, 300, 400, 450, 500, 600, 800, 900, 1000, 1200],
    supportsAdjustableShelves: true,
    handleVerticalPosition: "上沿",
    railHandleFilename: "G把在上",
    buildFronts: buildDoorFronts,
    buildLocalParts: (request) => {
      const doorCount = request.parameters?.doorCount ?? (request.size.width <= 600 ? 1 : 2);
      const isSingleDoor = doorCount === 1;
      const availableDoorWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;
      const doorWidth = isSingleDoor ? availableDoorWidth : (availableDoorWidth - frontGap) / 2;
      const doorHeight = request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom;
      const shelfCount = Math.max(0, Math.floor(request.parameters?.adjustableShelfCount ?? 1));
      const shelfHeights = Array.from(
        { length: shelfCount },
        (_, index) => request.size.height * (index + 1) / (shelfCount + 1),
      );
      return [
        ...createCarcass({
          id: request.instanceId,
          ...request.size,
          material: request.carcassMaterial,
          adjustableLegs: { height: request.parameters?.adjustableLegHeight ?? 120 },
        }),
        ...createAdjustableShelves({
          id: request.instanceId,
          width: Math.max(100, request.size.width - 36),
          depth: Math.max(100, request.size.depth - 54),
          thickness: 18,
          heightsZ: shelfHeights,
          positionX: request.size.width / 2,
          positionY: request.size.depth / 2,
          material: request.carcassMaterial,
        }),
        ...(doorCount === 0 ? [] : createDoor({
          id: `${request.instanceId}-${isSingleDoor ? "single" : "left"}-door`,
          nominalWidth: doorWidth,
          nominalHeight: doorHeight,
          position: {
            x: designStandards.doorGap.left + doorWidth / 2,
            y: -9,
            z: designStandards.doorGap.bottom + doorHeight / 2,
          },
          material: request.doorMaterial,
          handle: isSingleDoor ? request.handle : { ...request.handle, horizontalPosition: "右" },
        })),
        ...(doorCount === 2 ? createDoor({
          id: `${request.instanceId}-right-door`,
          nominalWidth: doorWidth,
          nominalHeight: doorHeight,
          position: {
            x: designStandards.doorGap.left + doorWidth + frontGap + doorWidth / 2,
            y: -9,
            z: designStandards.doorGap.bottom + doorHeight / 2,
          },
          material: request.doorMaterial,
          handle: { ...request.handle, horizontalPosition: "左" },
        }) : []),
      ];
    },
  },
  "BUH-H-BA---X--0X0XXX056": {
    modelCode: "BUH-H-BA---X--0X0XXX056",
    name: "活動層板高櫃",
    kind: "cabinet",
    cabinetClass: "tall",
    layoutGroup: "base",
    menuCategories: ["tall"],
    canAlignWallCabinet: false,
    frontType: "door",
    supportsAdjustableShelves: true,
    defaultSize: { width: 600, height: 2080, depth: 560 },
    defaultDoorCount: 1,
    defaultAdjustableShelfCount: 3,
    fixedShelfCount: 2,
    handleVerticalPosition: "中間",
    buildFronts: buildDoorFronts,
    buildLocalParts: buildTallShelfCabinet,
    buildCadData: (request) => ({
      parameters: {
        fixedShelfCount: 2,
        adjustableShelfCount: request.parameters?.adjustableShelfCount ?? 3,
      },
    }),
  },
  "BUH-H-BA--1X--060XXX056": {
    modelCode: "BUH-H-BA--1X--060XXX056",
    name: "1大電隔板高櫃",
    kind: "cabinet",
    cabinetClass: "tall",
    layoutGroup: "base",
    menuCategories: ["tall"],
    canAlignWallCabinet: false,
    frontType: "multi",
    defaultSize: { width: 600, height: 2080, depth: 560 },
    fixedDoorCount: 2,
    fixedShelfCount: 2,
    fixedAdjustableShelfCount: 2,
    fixedOpeningMethod: "左右開",
    handleVerticalPosition: "中間",
    buildFronts: buildApplianceTallFronts,
    buildLocalParts: buildApplianceTallCabinet,
    buildCadData: () => ({
      parameters: {
        fixedShelfCount: 2,
        adjustableShelfCount: 2,
        applianceCount: 1,
        applianceType: "大電器",
      },
    }),
  },
  "WU-H-WAX--X--0X00XX035": {
    modelCode: "WU-H-WAX--X--0X00XX035",
    name: "活動層板牆櫃",
    kind: "cabinet",
    cabinetClass: "wall",
    layoutGroup: "wall",
    menuCategories: ["wall"],
    canAlignWallCabinet: false,
    frontType: "door",
    defaultSize: { width: 800, height: 704, depth: 350 },
    standardWidths: [150, 200, 300, 400, 450, 500, 600, 800, 900, 1000],
    supportsAdjustableShelves: true,
    handleVerticalPosition: "下沿",
    railHandleFilename: "L把在下",
    buildFronts: buildDoorFronts,
    buildLocalParts: (request) => {
      const doorCount = request.parameters?.doorCount ?? (request.size.width <= 600 ? 1 : 2);
      const isSingleDoor = doorCount === 1;
      const availableDoorWidth = request.size.width - designStandards.doorGap.left - designStandards.doorGap.right;
      const doorWidth = isSingleDoor ? availableDoorWidth : (availableDoorWidth - frontGap) / 2;
      const doorHeight = request.size.height - designStandards.doorGap.top - designStandards.doorGap.bottom;
      const shelfCount = Math.max(0, Math.floor(request.parameters?.adjustableShelfCount ?? 1));
      const shelfHeights = Array.from(
        { length: shelfCount },
        (_, index) => request.size.height * (index + 1) / (shelfCount + 1),
      );
      return [
        ...createCarcass({
          id: request.instanceId,
          ...request.size,
          material: request.carcassMaterial,
        }),
        ...createAdjustableShelves({
          id: request.instanceId,
          width: Math.max(100, request.size.width - 36),
          depth: Math.max(100, request.size.depth - 54),
          thickness: 18,
          heightsZ: shelfHeights,
          positionX: request.size.width / 2,
          positionY: request.size.depth / 2,
          material: request.carcassMaterial,
        }),
        ...(doorCount === 0 ? [] : createDoor({
          id: `${request.instanceId}-${isSingleDoor ? "single" : "left"}-door`,
          nominalWidth: doorWidth,
          nominalHeight: doorHeight,
          position: {
            x: designStandards.doorGap.left + doorWidth / 2,
            y: -9,
            z: designStandards.doorGap.bottom + doorHeight / 2,
          },
          material: request.doorMaterial,
          handle: isSingleDoor ? request.handle : { ...request.handle, horizontalPosition: "右" },
        })),
        ...(doorCount === 2 ? createDoor({
          id: `${request.instanceId}-right-door`,
          nominalWidth: doorWidth,
          nominalHeight: doorHeight,
          position: {
            x: designStandards.doorGap.left + doorWidth + frontGap + doorWidth / 2,
            y: -9,
            z: designStandards.doorGap.bottom + doorHeight / 2,
          },
          material: request.doorMaterial,
          handle: { ...request.handle, horizontalPosition: "左" },
        }) : []),
      ];
    },
  },
  "BU-H-spaceholder": {
    modelCode: "BU-H-spaceholder",
    name: "空間占位地櫃",
    kind: "spaceholder",
    layoutGroup: "base",
    menuCategories: ["base"],
    canAlignWallCabinet: false,
    buildLocalParts: () => [],
  },
  "BUH-H-spaceholder": {
    modelCode: "BUH-H-spaceholder",
    name: "空間占位高櫃",
    kind: "spaceholder",
    layoutGroup: "base",
    menuCategories: ["tall"],
    defaultSize: { width: 600, height: 2080, depth: 560 },
    canAlignWallCabinet: false,
    buildLocalParts: () => [],
  },
  "WU-H-spaceholder": {
    modelCode: "WU-H-spaceholder",
    name: "空間占位牆櫃",
    kind: "spaceholder",
    layoutGroup: "wall",
    menuCategories: ["wall"],
    canAlignWallCabinet: false,
    buildLocalParts: () => [],
  },
  "BU-H-BF3-----0120XX056": {
    modelCode: "BU-H-BF3-----0120XX056",
    name: "地櫃填縫櫃",
    kind: "cabinet",
    cabinetClass: "base",
    layoutGroup: "base",
    menuCategories: ["base"],
    frontType: "none",
    defaultSize: { width: 50, height: 704, depth: 560 },
    minWidth: 18,
    maxWidth: 120,
    allowCustomWidth: true,
    fixedDoorCount: 1,
    canAlignWallCabinet: false,
    buildFronts: (request) => buildFillerFronts(request),
    buildLocalParts: (request) => createFillerCabinet({
      id: request.instanceId,
      width: request.size.width,
      height: request.size.height,
      depth: request.size.depth,
      doorHeightReduction: getFillerDoorHeightReduction(request),
      carcassMaterial: request.carcassMaterial,
      doorMaterial: request.doorMaterial,
    }),
  },
  "WU-H-WF3-----0120XX035": {
    modelCode: "WU-H-WF3-----0120XX035",
    name: "牆櫃填縫櫃",
    kind: "cabinet",
    cabinetClass: "wall",
    layoutGroup: "wall",
    menuCategories: ["wall"],
    frontType: "none",
    defaultSize: { width: 50, height: 704, depth: 350 },
    minWidth: 18,
    maxWidth: 120,
    allowCustomWidth: true,
    fixedDoorCount: 1,
    canAlignWallCabinet: false,
    buildFronts: (request) => buildFillerFronts(request),
    buildLocalParts: (request) => createFillerCabinet({
      id: request.instanceId,
      width: request.size.width,
      height: request.size.height,
      depth: request.size.depth,
      doorHeightReduction: getFillerDoorHeightReduction(request),
      carcassMaterial: request.carcassMaterial,
      doorMaterial: request.doorMaterial,
    }),
  },
  "BUH-H-BF5-----0120XX056": {
    modelCode: "BUH-H-BF5-----0120XX056",
    name: "高櫃填縫櫃",
    kind: "cabinet",
    cabinetClass: "tall",
    layoutGroup: "base",
    menuCategories: ["tall"],
    frontType: "none",
    defaultSize: { width: 50, height: 2080, depth: 560 },
    minWidth: 18,
    maxWidth: 120,
    allowCustomWidth: true,
    fixedDoorCount: 1,
    canAlignWallCabinet: false,
    buildFronts: (request) => buildFillerFronts(request),
    buildLocalParts: (request) => createFillerCabinet({
      id: request.instanceId,
      width: request.size.width,
      height: request.size.height,
      depth: request.size.depth,
      doorHeightReduction: getFillerDoorHeightReduction(request),
      carcassMaterial: request.carcassMaterial,
      doorMaterial: request.doorMaterial,
    }),
  },
  "BU-H-side-floor-panel": {
    modelCode: "BU-H-side-floor-panel",
    cadModelCode: structuralPanelCadModelCode,
    name: "地櫃／高櫃側落板",
    kind: "structural-panel",
    layoutGroup: "base",
    menuCategories: ["base", "tall"],
    defaultSize: { width: 18 },
    canAlignWallCabinet: true,
    buildLocalParts: (request) => buildStructuralPanel(request, "側落板"),
    buildCadData: (request) => buildStructuralPanelCadData(request, "側落板"),
  },
  "BU-H-side-panel": {
    modelCode: "BU-H-side-panel",
    cadModelCode: structuralPanelCadModelCode,
    name: "地櫃／高櫃側封板",
    kind: "structural-panel",
    layoutGroup: "base",
    menuCategories: ["base", "tall"],
    defaultSize: { width: 18 },
    canAlignWallCabinet: true,
    buildLocalParts: (request) => buildStructuralPanel(request, "側封板"),
    buildCadData: (request) => buildStructuralPanelCadData(request, "側封板"),
  },
  "WU-H-side-floor-panel": {
    modelCode: "WU-H-side-floor-panel",
    cadModelCode: structuralPanelCadModelCode,
    name: "牆櫃側落板",
    kind: "structural-panel",
    layoutGroup: "wall",
    menuCategories: ["wall"],
    defaultSize: { width: 18 },
    canAlignWallCabinet: false,
    buildLocalParts: (request) => buildStructuralPanel(request, "側落板"),
    buildCadData: (request) => buildStructuralPanelCadData(request, "側落板"),
  },
  "WU-H-side-panel": {
    modelCode: "WU-H-side-panel",
    cadModelCode: structuralPanelCadModelCode,
    name: "牆櫃側封板",
    kind: "structural-panel",
    layoutGroup: "wall",
    menuCategories: ["wall"],
    defaultSize: { width: 18 },
    canAlignWallCabinet: false,
    buildLocalParts: (request) => buildStructuralPanel(request, "側封板"),
    buildCadData: (request) => buildStructuralPanelCadData(request, "側封板"),
  },
};

export const cabinetOptions = Object.values(definitions).map(({
  modelCode, name, kind, cabinetClass, layoutGroup, menuCategories, frontType, supportsAdjustableShelves,
  defaultSize, standardWidths, minWidth, maxWidth, allowCustomWidth, defaultDoorCount, defaultAdjustableShelfCount,
  fixedDoorCount, fixedShelfCount, fixedAdjustableShelfCount, fixedOpeningMethod,
}) => ({
  modelCode,
  name,
  kind,
  cabinetClass,
  layoutGroup,
  menuCategories: menuCategories ?? [cabinetClass ?? (layoutGroup === "wall" ? "wall" : "base")],
  frontType,
  supportsAdjustableShelves: supportsAdjustableShelves ?? false,
  defaultSize,
  standardWidths,
  minWidth,
  maxWidth,
  allowCustomWidth: allowCustomWidth ?? false,
  defaultDoorCount,
  defaultAdjustableShelfCount,
  fixedDoorCount,
  fixedShelfCount,
  fixedAdjustableShelfCount,
  fixedOpeningMethod,
}));

function placePart(part: ScenePart, request: CabinetRequest): ScenePart {
  const angle = request.rotationDegrees * Math.PI / 180;
  return {
    ...part,
    position: {
      x: request.position.x + part.position.x * Math.cos(angle) - part.position.y * Math.sin(angle),
      y: request.position.y + part.position.x * Math.sin(angle) + part.position.y * Math.cos(angle),
      z: request.position.z + part.position.z,
    },
    rotationZ: part.rotationZ + angle,
  };
}

export function buildCabinet(request: CabinetRequest): SalesCabinetModel {
  const definition = definitions[request.modelCode];
  if (!definition) throw new Error(`Unknown cabinet model: ${request.modelCode}`);
  const effectiveRequest = {
    ...request,
    layoutGroup: definition.layoutGroup,
    parameters: {
      ...request.parameters,
      doorCount: definition.fixedDoorCount ?? request.parameters?.doorCount,
      adjustableShelfCount: definition.fixedAdjustableShelfCount ?? request.parameters?.adjustableShelfCount,
    },
    handle: {
      ...request.handle,
      openingMethod: definition.fixedOpeningMethod ?? request.handle.openingMethod,
      horizontalPosition: definition.frontType === "drawer"
        ? "中間" as const
        : request.handle.horizontalPosition,
      verticalPosition: definition.handleVerticalPosition ?? request.handle.verticalPosition,
      filename: request.handle.category === "L把或G把" && definition.railHandleFilename
        ? definition.railHandleFilename
        : request.handle.filename,
    },
  };
  const cadData = definition.buildCadData?.(effectiveRequest);
  const cadParameters = {
    ...(definition.defaultModelParameters ?? {}),
    ...(effectiveRequest.modelParameters ?? {}),
    ...(cadData?.parameters ?? {}),
  };
  return {
    ...effectiveRequest,
    modelName: definition.name,
    kind: definition.kind,
    cabinetClass: definition.cabinetClass ?? effectiveRequest.cabinetClass,
    cadModelCode: definition.cadModelCode,
    cadSize: cadData?.size,
    cadBaseElevation: cadData?.baseElevation,
    cadParameters: Object.keys(cadParameters).length > 0 ? cadParameters : undefined,
    fronts: definition.buildFronts?.(effectiveRequest),
    // 共用的側封／側落模型出現在地櫃與高櫃選單；只有地櫃實例可作為牆櫃對齊目標。
    canAlignWallCabinet: definition.canAlignWallCabinet && effectiveRequest.cabinetClass !== "tall",
    parts: definition.buildLocalParts(effectiveRequest).map((part) => placePart(part, effectiveRequest)),
  };
}
