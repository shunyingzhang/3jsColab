import type { SalesCabinetModel, ScenePart } from "@/lib/cabinet/types";
import type { BenchtopBuildInput } from "@/lib/benchtop/types";
import { defaultHandleSelection } from "@/lib/rules/handleCatalog";

/** 建立覆蓋同一方向連續地櫃的一字型檯面。 */
export function createBenchtop({ id, cabinets, material, parameters }: BenchtopBuildInput): SalesCabinetModel {
  const ordered = [...cabinets].sort((left, right) => (
    (left.placement?.sequence ?? 0) - (right.placement?.sequence ?? 0)
  ));
  const first = ordered[0];
  const last = ordered.at(-1);
  const firstPlacement = first?.placement;
  const lastPlacement = last?.placement;
  if (!first || !last || !firstPlacement || !lastPlacement) {
    throw new Error("一字型檯面至少需要一個有效地櫃。");
  }
  if (ordered.some((cabinet) => cabinet.placement?.run !== firstPlacement.run)) {
    throw new Error("同一段一字型檯面只能覆蓋相同方向的地櫃。");
  }

  const topElevations = ordered.map((cabinet) => cabinet.position.z + cabinet.size.height);
  const topElevation = topElevations[0];
  if (topElevations.some((value) => Math.abs(value - topElevation) > 0.01)) {
    throw new Error("同一段檯面覆蓋的地櫃頂面高度必須一致。");
  }

  const directionLength = Math.hypot(
    firstPlacement.p2.x - firstPlacement.p1.x,
    firstPlacement.p2.y - firstPlacement.p1.y,
  ) || 1;
  const pathDirection = {
    x: (firstPlacement.p2.x - firstPlacement.p1.x) / directionLength,
    y: (firstPlacement.p2.y - firstPlacement.p1.y) / directionLength,
  };
  const localX = { x: -pathDirection.x, y: -pathDirection.y };
  const rotationZ = first.rotationDegrees * Math.PI / 180;
  const depthDirection = { x: -Math.sin(rotationZ), y: Math.cos(rotationZ) };
  const p1 = {
    x: firstPlacement.p1.x + localX.x * parameters.startExtension,
    y: firstPlacement.p1.y + localX.y * parameters.startExtension,
    z: topElevation,
  };
  const p2 = {
    x: lastPlacement.p2.x - localX.x * parameters.endExtension,
    y: lastPlacement.p2.y - localX.y * parameters.endExtension,
    z: topElevation,
  };
  const width = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const cabinetRunWidth = Math.hypot(
    lastPlacement.p2.x - firstPlacement.p1.x,
    lastPlacement.p2.y - firstPlacement.p1.y,
  );
  const cabinetDepth = Math.max(...ordered.map((cabinet) => cabinet.size.depth));
  const totalDepth = cabinetDepth + parameters.frontOverhang + parameters.backOverhang;
  const depthCenter = (cabinetDepth + parameters.backOverhang - parameters.frontOverhang) / 2;
  const center = {
    x: (p1.x + p2.x) / 2 + depthDirection.x * depthCenter,
    y: (p1.y + p2.y) / 2 + depthDirection.y * depthCenter,
  };
  const radius = parameters.cornerRadius;
  const parts: ScenePart[] = [{
    id: `${id}-slab`,
    kind: "benchtop",
    size: { width, depth: totalDepth, height: parameters.thickness },
    position: { x: center.x, y: center.y, z: topElevation + parameters.thickness / 2 },
    rotationZ,
    material,
    geometry: {
      type: "rounded-box",
      radii: {
        frontRight: parameters.roundedCorners.frontRight ? radius : 0,
        backRight: parameters.roundedCorners.backRight ? radius : 0,
        backLeft: parameters.roundedCorners.backLeft ? radius : 0,
        frontLeft: parameters.roundedCorners.frontLeft ? radius : 0,
      },
    },
  }];

  if (parameters.backsplashEnabled) {
    const backsplashY = cabinetDepth + parameters.backOverhang - parameters.backsplashThickness / 2;
    parts.push({
      id: `${id}-backsplash`,
      kind: "backsplash",
      size: { width, depth: parameters.backsplashThickness, height: parameters.backsplashHeight },
      position: {
        x: (p1.x + p2.x) / 2 + depthDirection.x * backsplashY,
        y: (p1.y + p2.y) / 2 + depthDirection.y * backsplashY,
        z: topElevation + parameters.thickness + parameters.backsplashHeight / 2,
      },
      rotationZ,
      material,
      geometry: { type: "box" },
    });
  }

  return {
    instanceId: id,
    modelCode: "benchtop_1",
    modelName: "一字型檯面",
    kind: "benchtop",
    layoutGroup: "base",
    size: { width, depth: totalDepth, height: parameters.thickness },
    position: { x: p2.x, y: p2.y, z: topElevation },
    rotationDegrees: first.rotationDegrees,
    doorMaterial: material,
    carcassMaterial: material,
    handle: defaultHandleSelection,
    cadSize: {
      width: cabinetRunWidth,
      depth: cabinetDepth,
      height: parameters.thickness,
    },
    placement: {
      run: firstPlacement.run,
      runIndex: 1,
      sequence: 10_000,
      p1,
      p2,
    },
    /** CAD 以被覆蓋地櫃的原始端點定位；檯面延伸量另由 overhang 表示。 */
    cadPlacement: {
      run: firstPlacement.run,
      runIndex: firstPlacement.runIndex,
      sequence: 10_000,
      p1: firstPlacement.p1,
      p2: lastPlacement.p2,
    },
    cadBaseElevation: topElevation,
    cadParameters: {
      materialCategory: material.category,
      materialSeries: material.series,
      thickness: { type: "length", value: parameters.thickness },
      frontOverhang: { type: "length", value: parameters.frontOverhang },
      backOverhang: { type: "length", value: parameters.backOverhang },
      startExtension: { type: "length", value: parameters.startExtension },
      endExtension: { type: "length", value: parameters.endExtension },
      backsplashEnabled: parameters.backsplashEnabled,
      backsplashHeight: { type: "length", value: parameters.backsplashHeight },
      backsplashThickness: { type: "length", value: parameters.backsplashThickness },
      frontRightCornerRadius: { type: "length", value: parameters.roundedCorners.frontRight ? radius : 0 },
      backRightCornerRadius: { type: "length", value: parameters.roundedCorners.backRight ? radius : 0 },
      backLeftCornerRadius: { type: "length", value: parameters.roundedCorners.backLeft ? radius : 0 },
      frontLeftCornerRadius: { type: "length", value: parameters.roundedCorners.frontLeft ? radius : 0 },
    },
    canAlignWallCabinet: false,
    parts,
  };
}
