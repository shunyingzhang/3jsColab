export const designStandards = {
  unit: "mm",
  layout: {
    cornerClearance: 20,
    preferredStandardWidths: [600, 800, 900],
  },
  structuralPanel: {
    frontExtension: 20,
  },
  board: { doorThickness: 18, carcassThickness: 18 },
  doorGap: { left: 2, right: 2, top: 2, bottom: 2, between: 3 },
  handle: {
    fHandleReduction: 35,
    kHandleReduction: 2,
    gHandleReduction: 32,
    horizontalInset: 35,
    verticalInset: 30,
  },
} as const;
