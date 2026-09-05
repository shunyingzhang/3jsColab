"use client";

import { useMemo, useState } from "react";
import KitchenViewer from "@/components/KitchenViewer";
import type { BenchtopMaterial, BenchtopParameters } from "@/lib/benchtop/types";
import type { CabinetModelCode, MaterialSelection, SalesCabinetModel } from "@/lib/cabinet/types";
import { cabinetOptions } from "@/lib/catalog/cabinetCatalog";
import { createBenchtop } from "@/lib/generators/createBenchtop";
import { createBasicLayout, getModelDefaults } from "@/lib/layout/createBasicLayout";
import {
  defaultHandleSelection,
  handleCategories,
  handleOptionsByCategory,
  normalizeHandleSelection,
  type HandleCategory,
  type HandleSelection,
} from "@/lib/rules/handleCatalog";

const fallbackMaterial: MaterialSelection = { file: "", name: "无贴图", textureUrl: "" };
const defaultBenchtop: BenchtopParameters = {
  thickness: 36,
  frontOverhang: 40,
  backOverhang: 0,
  startExtension: 0,
  endExtension: 0,
  backsplashEnabled: true,
  backsplashHeight: 36,
  backsplashThickness: 10,
  roundedCorners: { frontRight: false, backRight: false, backLeft: false, frontLeft: false },
  cornerRadius: 20,
};

export default function BasicKitchenDemo({ materials, benchtopMaterials }: {
  materials: MaterialSelection[];
  benchtopMaterials: BenchtopMaterial[];
}) {
  const [modelCode, setModelCode] = useState<CabinetModelCode>("BU-H-BA-X-X--0X00XX056");
  const initial = getModelDefaults(modelCode);
  const [xCount, setXCount] = useState(3);
  const [yCount, setYCount] = useState(0);
  const [width, setWidth] = useState(initial.width);
  const [height, setHeight] = useState(initial.height);
  const [depth, setDepth] = useState(initial.depth);
  const [elevation, setElevation] = useState(initial.elevation);
  const [doorCount, setDoorCount] = useState<0 | 1 | 2>(initial.doorCount);
  const [adjustableShelfCount, setAdjustableShelfCount] = useState(initial.adjustableShelfCount);
  const [doorMaterialFile, setDoorMaterialFile] = useState(() => materials.find((item) => item.file.includes("莊園可可"))?.file ?? materials[0]?.file ?? "");
  const [carcassMaterialFile, setCarcassMaterialFile] = useState(() => materials.find((item) => item.file.includes("雪花霧白"))?.file ?? materials[0]?.file ?? "");
  const [handle, setHandle] = useState<HandleSelection>(defaultHandleSelection);
  const [benchtopEnabled, setBenchtopEnabled] = useState(true);
  const [benchtopMaterialFile, setBenchtopMaterialFile] = useState(benchtopMaterials[0]?.file ?? "");
  const [benchtopParameters, setBenchtopParameters] = useState(defaultBenchtop);

  const selectedOption = cabinetOptions.find((item) => item.modelCode === modelCode);
  const doorMaterial = materials.find((item) => item.file === doorMaterialFile) ?? materials[0] ?? fallbackMaterial;
  const carcassMaterial = materials.find((item) => item.file === carcassMaterialFile) ?? materials[0] ?? fallbackMaterial;
  const benchtopMaterial = benchtopMaterials.find((item) => item.file === benchtopMaterialFile) ?? benchtopMaterials[0];
  const currentHandleOptions = handleOptionsByCategory[handle.category];

  const changeModel = (nextModelCode: CabinetModelCode) => {
    const defaults = getModelDefaults(nextModelCode);
    setModelCode(nextModelCode);
    setWidth(defaults.width);
    setHeight(defaults.height);
    setDepth(defaults.depth);
    setElevation(defaults.elevation);
    setDoorCount(defaults.doorCount);
    setAdjustableShelfCount(defaults.adjustableShelfCount);
  };

  const cabinets = useMemo(() => createBasicLayout({
    modelCode,
    xCount,
    yCount,
    width,
    height,
    depth,
    elevation,
    doorCount,
    adjustableShelfCount,
    doorMaterial,
    carcassMaterial,
    handle: normalizeHandleSelection(handle),
  }), [adjustableShelfCount, carcassMaterial, depth, doorCount, doorMaterial, elevation, handle, height, modelCode, width, xCount, yCount]);

  const displayModels = useMemo(() => {
    const result: SalesCabinetModel[] = [...cabinets];
    const xBaseCabinets = cabinets.filter((cabinet) => (
      cabinet.kind === "cabinet"
      && cabinet.cabinetClass === "base"
      && cabinet.placement?.run === "x"
    ));
    if (benchtopEnabled && benchtopMaterial && xBaseCabinets.length > 0) {
      result.push(createBenchtop({
        id: "benchtop-1",
        cabinets: xBaseCabinets,
        material: benchtopMaterial,
        parameters: benchtopParameters,
      }));
    }
    return result;
  }, [benchtopEnabled, benchtopMaterial, benchtopParameters, cabinets]);

  const updateHandleCategory = (category: HandleCategory) => {
    const filename = handleOptionsByCategory[category][0]?.filename ?? "";
    setHandle((current) => ({ ...current, category, filename }));
  };

  return (
    <main className="app-shell">
      <KitchenViewer cabinets={displayModels} />
      <aside className="panel">
        <h1>3jsColab 外观核心</h1>
        <p>完整柜型、门板色、把手和台面；不包含文字解析、AI或CAD输出。</p>

        <Field label="柜型">
          <select value={modelCode} onChange={(event) => changeModel(event.target.value as CabinetModelCode)}>
            {cabinetOptions.map((option) => (
              <option key={`${option.modelCode}-${option.name}`} value={option.modelCode}>{option.name}</option>
            ))}
          </select>
        </Field>
        <div className="two-columns">
          <NumberField label="X数量" value={xCount} min={0} max={8} onChange={setXCount} />
          <NumberField label="Y数量" value={yCount} min={0} max={8} onChange={setYCount} />
          <NumberField label="宽度 mm" value={width} min={18} max={2400} step={10} onChange={setWidth} />
          <NumberField label="高度 mm" value={height} min={100} max={3000} step={10} onChange={setHeight} />
          <NumberField label="深度 mm" value={depth} min={50} max={1200} step={10} onChange={setDepth} />
          <NumberField label="离地 mm" value={elevation} min={0} max={2500} step={10} onChange={setElevation} />
        </div>

        <Field label="门片数量">
          <select value={doorCount} onChange={(event) => setDoorCount(Number(event.target.value) as 0 | 1 | 2)}>
            <option value={0}>无</option><option value={1}>一片</option><option value={2}>二片</option>
          </select>
        </Field>
        <NumberField label="活动层板数量" value={adjustableShelfCount} min={0} max={8} onChange={setAdjustableShelfCount} />

        <MaterialPicker label="门板颜色" materials={materials} selected={doorMaterialFile} onSelect={setDoorMaterialFile} />
        <MaterialPicker label="柜体颜色" materials={materials} selected={carcassMaterialFile} onSelect={setCarcassMaterialFile} />

        <Field label="把手类别">
          <select value={handle.category} onChange={(event) => updateHandleCategory(event.target.value as HandleCategory)}>
            {handleCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <div className="choice-grid">
          {currentHandleOptions.map((option) => (
            <button
              type="button"
              key={option.filename || option.label}
              className={`choice ${handle.filename === option.filename ? "selected" : ""}`}
              onClick={() => setHandle((current) => ({ ...current, filename: option.filename }))}
            >
              {option.previewFile && <span className="handle-preview" style={{ backgroundImage: `url(/handles/${encodeURIComponent(option.previewFile)})` }} />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <div className="two-columns">
          <Field label="左右位置">
            <select value={handle.horizontalPosition} onChange={(event) => setHandle((current) => ({ ...current, horizontalPosition: event.target.value as HandleSelection["horizontalPosition"] }))}>
              <option>左</option><option>中間</option><option>右</option>
            </select>
          </Field>
          <Field label="上下位置">
            <select value={handle.verticalPosition} onChange={(event) => setHandle((current) => ({ ...current, verticalPosition: event.target.value as HandleSelection["verticalPosition"] }))}>
              <option>上沿</option><option>中間</option><option>下沿</option>
            </select>
          </Field>
        </div>

        <section className="section">
          <label className="checkbox"><input type="checkbox" checked={benchtopEnabled} onChange={(event) => setBenchtopEnabled(event.target.checked)} />显示一字型台面</label>
          <MaterialPicker label="台面颜色" materials={benchtopMaterials} selected={benchtopMaterialFile} onSelect={setBenchtopMaterialFile} />
          <div className="two-columns">
            <NumberField label="厚度 mm" value={benchtopParameters.thickness} min={10} max={100} onChange={(value) => setBenchtopParameters((current) => ({ ...current, thickness: value }))} />
            <NumberField label="前突出 mm" value={benchtopParameters.frontOverhang} min={0} max={150} onChange={(value) => setBenchtopParameters((current) => ({ ...current, frontOverhang: value }))} />
          </div>
          <label className="checkbox"><input type="checkbox" checked={benchtopParameters.backsplashEnabled} onChange={(event) => setBenchtopParameters((current) => ({ ...current, backsplashEnabled: event.target.checked }))} />显示后挡水</label>
        </section>

        <div className="summary">
          当前：{selectedOption?.name}<br />
          柜体：{cabinets.length} 个<br />
          坐标：X左右、Y前后、Z高度
        </div>
      </aside>
    </main>
  );
}

function MaterialPicker({ label, materials, selected, onSelect }: {
  label: string;
  materials: MaterialSelection[];
  selected: string;
  onSelect: (file: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="material-grid">
        {materials.map((material) => (
          <button
            type="button"
            key={material.file}
            className={`material ${selected === material.file ? "selected" : ""}`}
            onClick={() => onSelect(material.file)}
            title={material.name}
          >
            <span style={{ backgroundImage: `url(${material.textureUrl})` }} />
            <small>{material.name}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

function NumberField({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
      }} />
    </Field>
  );
}
