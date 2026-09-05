import { readdir } from "node:fs/promises";
import path from "node:path";
import BasicKitchenDemo from "@/components/BasicKitchenDemo";
import { createBenchtopMaterialCatalog } from "@/lib/catalog/benchtopMaterialCatalog";
import type { MaterialSelection } from "@/lib/cabinet/types";

const imagePattern = /\.(jpe?g|png|webp)$/i;

export default async function Home() {
  const files = await readdir(path.join(process.cwd(), "public"));
  const materials: MaterialSelection[] = files
    .filter((file) => imagePattern.test(file) && file !== "PM832.jpg")
    .sort((a, b) => a.localeCompare(b, "zh-Hant"))
    .map((file) => ({
      file,
      name: file.replace(imagePattern, ""),
      textureUrl: `/${encodeURIComponent(file)}`,
    }));

  return (
    <BasicKitchenDemo
      materials={materials}
      benchtopMaterials={createBenchtopMaterialCatalog()}
    />
  );
}
