import { designStandards } from "@/lib/config/designStandards";

export type HandleCategory = "一般把手1" | "一般把手2" | "上崁把手" | "L把或G把" | "拍拍手" | "無";
export type HandleHorizontalPosition = "左" | "中間" | "右";
export type HandleVerticalPosition = "上沿" | "中間" | "下沿";
export type DoorOpeningMethod = "左右開" | "上開";

export type HandleSelection = {
  category: HandleCategory;
  filename: string;
  horizontalPosition: HandleHorizontalPosition;
  verticalPosition: HandleVerticalPosition;
  openingMethod: DoorOpeningMethod;
};

export type HandleOption = { filename: string; label: string; previewFile?: string };

export const handleCategories: HandleCategory[] = [
  "一般把手1", "一般把手2", "上崁把手", "L把或G把", "拍拍手", "無",
];

const general2Files = [
  "2A433-鋁-128.bmp", "2A433-鋁-160.bmp", "2A433-鋁-320.bmp",
  "2A559-鋁-224.bmp", "2A559-鋁-480.bmp", "2A559-黑-224.bmp", "2A559-黑-480.bmp",
  "2A753-銀-224.bmp", "2A753-黑-224..bmp", "2A753-黑-720.bmp",
  "2C849-銀-096.bmp", "2C849-銀-128.bmp", "2C850-銀-096.bmp", "2C850-銀-128.bmp",
  "2C859-銀-128.bmp", "2C890-黑-160.bmp", "2C890-鋁-256.bmp",
  "2DF100-鋁-128.bmp", "2DF100-鋁-160.bmp", "2DF100-鋁-224.bmp",
  "2DF125-鋁-128.bmp", "2DF28-鋁-096.bmp", "2DF28-鋁-160.bmp",
  "2DF276-鋁-480.bmp", "2DF276-鋁-768.bmp",
  "2L128-銀-096.bmp", "2L128-銀-160.bmp", "2L128-銀-320.bmp",
  "2L134-鋁-160.bmp", "2L134-鋁-224.bmp", "2L134-鋁-320.bmp",
  "2ST467-銀-224.bmp",
];

function option(filename: string): HandleOption {
  const stem = filename.replace(/.(bmp|png)$/i, "").replace(/.$/, "");
  return { filename, label: stem, previewFile: `${stem}.png` };
}

export const handleOptionsByCategory: Record<HandleCategory, HandleOption[]> = {
  "一般把手1": ["1A750-黑-224.bmp", "1B085.bmp"].map(option),
  "一般把手2": general2Files.map(option),
  "上崁把手": ["3F把手.bmp", "3K把手.bmp"].map(option),
  "L把或G把": [
    { filename: "G把在上", label: "G把在上" },
    { filename: "L把在下", label: "L把在下" },
    { filename: "L把左開", label: "L把左開" },
    { filename: "L把右開", label: "L把右開" },
  ],
  "拍拍手": [{ filename: "", label: "拍拍手" }],
  "無": [{ filename: "", label: "無" }],
};

export const defaultHandleSelection: HandleSelection = {
  category: "一般把手1",
  filename: "1B085.bmp",
  horizontalPosition: "右",
  verticalPosition: "上沿",
  openingMethod: "左右開",
};

export function normalizeHandleSelection(selection: HandleSelection): HandleSelection {
  if (selection.openingMethod === "上開") {
    return { ...selection, category: "拍拍手", filename: "", horizontalPosition: "中間", verticalPosition: "中間" };
  }
  const options = handleOptionsByCategory[selection.category];
  const filename = options.some((item) => item.filename === selection.filename)
    ? selection.filename
    : options[0]?.filename ?? "";
  return { ...selection, filename };
}

export function getDoorHeightReduction(selection: HandleSelection) {
  if (selection.category === "上崁把手") {
    return selection.filename === "3K把手.bmp"
      ? designStandards.handle.kHandleReduction
      : designStandards.handle.fHandleReduction;
  }
  if (selection.category === "L把或G把" && selection.filename === "G把在上") {
    return designStandards.handle.gHandleReduction;
  }
  return 0;
}

export function parseGeneralHandle2(filename: string) {
  const stem = filename.replace(/[.]+(?:bmp|png)$/i, "");
  const pieces = stem.split("-");
  const lengthText = pieces.at(-1) ?? "128";
  const colorText = pieces.at(-2);
  return {
    model: (pieces[0] ?? stem).replace(/^2/, ""),
    color: colorText === "黑" || colorText === "鋁" || colorText === "銀" ? colorText : "銀",
    length: Number.isFinite(Number(lengthText)) ? Number(lengthText) : 128,
  };
}
