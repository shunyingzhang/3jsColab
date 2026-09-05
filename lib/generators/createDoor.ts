import type { MaterialSelection, ScenePart, Vector3 } from "@/lib/cabinet/types";
import { designStandards } from "@/lib/config/designStandards";
import { calculateDoor } from "@/lib/rules/calculateDoor";
import { parseGeneralHandle2, type HandleSelection } from "@/lib/rules/handleCatalog";

export type DoorInput = {
  id: string;
  kind?: "door" | "drawer-front";
  nominalWidth: number;
  nominalHeight: number;
  thickness?: number;
  position: Vector3;
  rotationZ?: number;
  material: MaterialSelection;
  handle: HandleSelection;
};

export function createDoor(input: DoorInput): ScenePart[] {
  const calculated = calculateDoor(input);
  const thickness = input.thickness ?? calculated.thickness;
  const rotationZ = input.rotationZ ?? 0;
  const panel: ScenePart = {
    id: `${input.id}-panel`,
    kind: input.kind ?? "door",
    size: { width: calculated.width, depth: thickness, height: calculated.height },
    position: calculated.position,
    rotationZ,
    material: input.material,
  };

  return [panel, ...createHandleParts(input, panel)];
}

function createHandleParts(input: DoorInput, panel: ScenePart): ScenePart[] {
  const selection = input.handle;
  if (selection.category === "拍拍手" || selection.category === "無") return [];
  if (selection.category === "L把或G把" && selection.filename !== "G把在上") return [];

  const frontY = panel.position.y - panel.size.depth / 2 - 8;
  const metal = handleColor(selection.filename);

  if (selection.category === "上崁把手") {
    const atBottom = selection.verticalPosition === "下沿";
    if (selection.filename === "3K把手.bmp") {
      const gripWidth = panel.size.width * 2 / 3;
      const edgeZ = panel.position.z + (atBottom ? -panel.size.height / 2 : panel.size.height / 2);
      const direction = atBottom ? -1 : 1;
      const outsideY = panel.position.y - panel.size.depth / 2;
      const gripLength = 10;
      const projectedHalfLength = gripLength / Math.sqrt(2) / 2;
      return [
        handlePart(
          input,
          "k-top-plate",
          { width: panel.size.width, depth: panel.size.depth, height: 2 },
          { x: panel.position.x, y: panel.position.y, z: edgeZ + direction },
          metal,
        ),
        handlePart(
          input,
          "k-grip-lip",
          { width: gripWidth, depth: 2, height: gripLength },
          {
            x: panel.position.x,
            y: outsideY - projectedHalfLength,
            z: edgeZ - direction * projectedHalfLength,
          },
          metal,
          { type: "slanted-plate", angleDegrees: -direction * 45 },
        ),
      ];
    }
    return [{
      id: `${input.id}-inset-handle`,
      kind: "handle",
      size: { width: panel.size.width, depth: 24, height: 35 },
      position: {
        x: panel.position.x,
        y: panel.position.y + panel.size.depth / 2 + 10,
        z: panel.position.z + (atBottom ? -panel.size.height / 2 - 17.5 : panel.size.height / 2 + 17.5),
      },
      rotationZ: panel.rotationZ,
      material: { color: metal, name: selection.filename },
      geometry: { type: "c-profile", wall: 4 },
    }];
  }

  if (selection.category === "L把或G把") {
    return [{
      id: `${input.id}-g-handle`,
      kind: "handle",
      size: { width: panel.size.width, depth: 32, height: 32 },
      position: {
        x: panel.position.x,
        y: panel.position.y + panel.size.depth / 2 + 14,
        z: panel.position.z + panel.size.height / 2 + 16,
      },
      rotationZ: panel.rotationZ,
      material: { color: "#45484a", name: "G把在上" },
      geometry: { type: "c-profile", wall: 5 },
    }];
  }

  if (selection.category === "一般把手2") {
    const parsed = parseGeneralHandle2(selection.filename);
    const length = Math.min(parsed.length, Math.max(40, panel.size.width - 30));
    const x = horizontalPosition(panel, selection.horizontalPosition, length);
    const z = verticalPosition(panel, selection.verticalPosition, 28);
    const color = parsed.color === "黑" ? "#161719" : parsed.color === "鋁" ? "#c9d0d2" : "#92999d";
    return [
      handlePart(input, "bar", { width: length, depth: 14, height: 14 }, { x, y: frontY - 10, z }, color, {
        type: "cylinder", axis: "x", radialSegments: 24,
      }),
    ];
  }

  if (selection.filename.startsWith("1A750")) {
    const width = Math.min(224, Math.max(80, panel.size.width - 30));
    const x = horizontalPosition(panel, selection.horizontalPosition, width);
    const z = verticalPosition(panel, selection.verticalPosition, 42);
    return [
      handlePart(input, "recess-frame", { width, depth: 10, height: 42 }, { x, y: frontY, z }, "#252729"),
      handlePart(input, "recess-inner", { width: width - 30, depth: 7, height: 20 }, { x, y: frontY - 7, z }, "#090a0b"),
    ];
  }

  const x = horizontalPosition(panel, selection.horizontalPosition, 36);
  const z = verticalPosition(panel, selection.verticalPosition, 36);
  return [
    handlePart(input, "knob-stem", { width: 22, depth: 24, height: 22 }, { x, y: frontY, z }, "#aeb4b6", {
      type: "cylinder", axis: "y", radiusTop: 10, radiusBottom: 10, radialSegments: 28,
    }),
    handlePart(input, "knob-face", { width: 36, depth: 12, height: 36 }, { x, y: frontY - 18, z }, "#c4c8c9", {
      type: "cylinder", axis: "y", radiusTop: 18, radiusBottom: 13, radialSegments: 32,
    }),
  ];
}

function horizontalPosition(panel: ScenePart, position: HandleSelection["horizontalPosition"], handleWidth: number) {
  if (position === "中間") return panel.position.x;
  const direction = position === "左" ? -1 : 1;
  return panel.position.x + direction * Math.max(
    0,
    panel.size.width / 2 - designStandards.handle.horizontalInset - handleWidth / 2,
  );
}

function verticalPosition(panel: ScenePart, position: HandleSelection["verticalPosition"], handleHeight: number) {
  if (position === "中間") return panel.position.z;
  const direction = position === "下沿" ? -1 : 1;
  return panel.position.z + direction * Math.max(
    0,
    panel.size.height / 2 - designStandards.handle.verticalInset - handleHeight / 2,
  );
}

function handleColor(filename: string) {
  if (filename.includes("黑")) return "#161719";
  if (filename.includes("銀")) return "#92999d";
  return "#c9d0d2";
}

function handlePart(
  input: DoorInput,
  suffix: string,
  size: ScenePart["size"],
  position: Vector3,
  color: string,
  geometry?: ScenePart["geometry"],
): ScenePart {
  return {
    id: `${input.id}-handle-${suffix}`,
    kind: "handle",
    size,
    position,
    rotationZ: input.rotationZ ?? 0,
    material: { color, name: input.handle.filename },
    geometry,
  };
}
