import type { MaterialSelection, SalesCabinetModel } from "@/lib/cabinet/types";

export type BenchtopCorner = "frontRight" | "backRight" | "backLeft" | "frontLeft";

export type BenchtopParameters = {
  thickness: number;
  frontOverhang: number;
  backOverhang: number;
  startExtension: number;
  endExtension: number;
  backsplashEnabled: boolean;
  backsplashHeight: number;
  backsplashThickness: number;
  roundedCorners: Record<BenchtopCorner, boolean>;
  cornerRadius: number;
};

export type BenchtopMaterial = MaterialSelection & {
  category: "石材" | "不鏽鋼" | "美耐板" | "板材";
  series: string;
};

export type BenchtopBuildInput = {
  id: string;
  cabinets: SalesCabinetModel[];
  material: BenchtopMaterial;
  parameters: BenchtopParameters;
};
