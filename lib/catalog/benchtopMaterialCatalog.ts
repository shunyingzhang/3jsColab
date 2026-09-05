import type { BenchtopMaterial } from "@/lib/benchtop/types";

export function createBenchtopMaterialCatalog(basePath = ""): BenchtopMaterial[] {
  return [{
    category: "石材",
    series: "樂天石",
    file: "PM832.jpg",
    name: "PM832",
    textureUrl: `${basePath}/${encodeURIComponent("PM832.jpg")}`,
  }];
}
